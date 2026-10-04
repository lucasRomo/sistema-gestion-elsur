package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.RespaldoLogRepository;
import com.elsur.sistema_gestion.services.RespaldoService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import org.hibernate.Session;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.persister.entity.EntityPersister;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RespaldoServiceImpl implements RespaldoService {

    private static final String BUCKET = "respaldos";
    private static final String TABLA_RESPALDOS_LOG = "respaldos_log";

    private static final List<String> ORDEN_ENTIDADES = List.of(
        "TipoDocumento", "TipoPersona", "TipoProveedor", "EstadoTurno",
        "UnidadMedida", "Permiso", "Rol", "RolPermiso",
        "CategoriaProducto", "categoriaCliente", "Institucion", "Area_Curso", "Direccion",

        "Persona", "Usuario", "Empleado", "Cliente", "Proveedor",

        "Insumo", "Maquina", "Producto", "ProductoInsumo",

        "Turno", "Incidencia", "CompraProveedor", "DetalleCompraInsumo", "Merma",
        "Pedido", "DetallePedido", "AsignacionPedido", "ComprobantePago", "HistorialEstadoPedido",
        "MovimientoCaja", "MovimientoCuentaCorriente", "DocumentoDigital", "RegistroActividad"
    );

    @Autowired
    private RespaldoLogRepository respaldoLogRepository;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    @PersistenceContext
    private EntityManager entityManager;

    private final Map<String, Map<String, ColumnaInfo>> infoColumnasCache = new HashMap<>();

    private static final class ColumnaInfo {
        final String tipoDato;
        final boolean nullable;
        final boolean tieneDefault;

        ColumnaInfo(String tipoDato, boolean nullable, boolean tieneDefault) {
            this.tipoDato = tipoDato;
            this.nullable = nullable;
            this.tieneDefault = tieneDefault;
        }
    }

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private abstract static class HibernateProxyMixIn {}

    // Usuario.password está anotado como WRITE_ONLY (y contrasenaVisible como @JsonIgnore) para que
    // nunca se expongan por la API normal. Pero eso mismo hacía que el respaldo de contingencia
    // generara un JSON sin esos valores, y al restaurar, la columna "contrasena" (NOT NULL) llegaba
    // en null y la restauración completa fallaba. Este mixin se usa solo para el respaldo, para que
    // esos dos campos sí se incluyan en el JSON exportado.
    private abstract static class UsuarioBackupMixIn {
        @JsonProperty
        String password;

        @JsonProperty
        String contrasenaVisible;
    }

    @Override
    public byte[] generarRespaldoContingente(String usuarioOperador) {
        try {
            Map<String, Object> backupData = new HashMap<>();

            backupData.put("_sistema", "El Sur - Centro de Copiado");
            backupData.put("_version", "1.0.0");
            backupData.put("_fechaGeneracion", LocalDateTime.now().toString());
            backupData.put("_generadoPor", usuarioOperador != null ? usuarioOperador : "Sistema");

            Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();
            Map<String, Object> tablasData = new HashMap<>();

            for (EntityType<?> entity : entities) {
                String nombreEntidad = entity.getName();

                if ("RespaldoLog".equalsIgnoreCase(nombreEntidad)) {
                    continue;
                }

                try {
                    List<?> registros = entityManager
                            .createQuery("SELECT e FROM " + nombreEntidad + " e", entity.getJavaType())
                            .getResultList();
                    tablasData.put(nombreEntidad, registros);
                } catch (Exception e) {
                    tablasData.put(nombreEntidad, "Error al exportar: " + e.getMessage());
                }
            }
            backupData.put("datos", tablasData);

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
            objectMapper.addMixIn(Object.class, HibernateProxyMixIn.class);
            objectMapper.addMixIn(Usuario.class, UsuarioBackupMixIn.class);

            String jsonOutput = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(backupData);
            byte[] bytes = jsonOutput.getBytes(StandardCharsets.UTF_8);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = "backup_elsur_contingencia_" + timestamp + ".json";

            supabaseStorageService.subirBytes(bytes, fileName, "application/json", BUCKET);

            String tamanioKB = String.format("%.2f KB", bytes.length / 1024.0);
            RespaldoLog log = new RespaldoLog(
                LocalDateTime.now(),
                fileName,
                tamanioKB,
                usuarioOperador != null ? usuarioOperador : "Operario Mostrador",
                "Contingencia Local"
            );
            respaldoLogRepository.save(log);

            return bytes;
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el respaldo de contingencia: " + e.getMessage(), e);
        }
    }

    @Override
    public List<RespaldoLog> obtenerHistorial() {
        return respaldoLogRepository.findAllByOrderByFechaHoraDesc();
    }

    @Override
    public void eliminarRespaldo(Integer idRespaldo) {
        RespaldoLog log = respaldoLogRepository.findById(idRespaldo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Respaldo no encontrado con ID: " + idRespaldo));

        try {
            supabaseStorageService.eliminarArchivo(BUCKET, log.getNombreArchivo());
        } catch (Exception e) {
            System.err.println("No se pudo eliminar el archivo de Supabase Storage: " + e.getMessage());
        }

        respaldoLogRepository.deleteById(idRespaldo);
    }

    @Override
    public byte[] descargarRespaldoPorId(Integer idRespaldo) {
        RespaldoLog log = respaldoLogRepository.findById(idRespaldo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Respaldo no encontrado con ID: " + idRespaldo));

        try {
            return supabaseStorageService.descargarArchivo(BUCKET, log.getNombreArchivo());
        } catch (Exception e) {
            throw new RuntimeException("Error al leer el archivo de respaldo desde Supabase: " + e.getMessage(), e);
        }
    }

    @Transactional
    @Override
    public void restaurarRespaldo(MultipartFile archivo) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            Map<String, Object> root = objectMapper.readValue(archivo.getInputStream(), Map.class);
            Map<String, Object> datos = (Map<String, Object>) root.get("datos");

            if (datos == null) {
                throw new SolicitudInvalidaException("Formato de respaldo inválido: no se encontró el nodo 'datos'.");
            }

            Map<String, EntityType<?>> metamodelMap = entityManager.getMetamodel().getEntities().stream()
                .collect(Collectors.toMap(EntityType::getName, e -> e, (e1, e2) -> e1));

            truncarTodasLasTablas();
            entityManager.clear();

            for (String nombreEntidad : ORDEN_ENTIDADES) {
                if (datos.containsKey(nombreEntidad) && metamodelMap.containsKey(nombreEntidad)) {
                    restaurarListaEntidadConId(datos.get(nombreEntidad), metamodelMap.get(nombreEntidad));
                }
            }

            for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
                String nombreEntidad = entity.getName();
                if (!ORDEN_ENTIDADES.contains(nombreEntidad) && !"RespaldoLog".equals(nombreEntidad)
                        && datos.containsKey(nombreEntidad)) {
                    restaurarListaEntidadConId(datos.get(nombreEntidad), entity);
                }
            }

        } catch (SolicitudInvalidaException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al restaurar los datos: " + e.getMessage(), e);
        }
    }

    private void truncarTodasLasTablas() {
        String bloque =
            "DO $$ DECLARE r RECORD; BEGIN " +
            "FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '" + TABLA_RESPALDOS_LOG + "') LOOP " +
            "EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE'; " +
            "END LOOP; END $$;";

        entityManager.createNativeQuery(bloque).executeUpdate();
    }

    @SuppressWarnings("unchecked")
    private void restaurarListaEntidadConId(Object listaRegistros, EntityType<?> entity) {
        if (!(listaRegistros instanceof List)) return;

        String nombreEntidad = entity.getName();
        Class<?> claseEntidad = entity.getJavaType();
        List<?> registros = (List<?>) listaRegistros;
        if (registros.isEmpty()) return;

        if ("RolPermiso".equals(nombreEntidad)) {
            for (Object reg : registros) {
                Map<String, Object> mapaReg = (Map<String, Object>) reg;
                Map<String, Object> idMap = (Map<String, Object>) mapaReg.get("id");
                if (idMap == null) continue;

                LinkedHashMap<String, Object> columnas = new LinkedHashMap<>();
                columnas.put("id_rol", normalizarValorEscalar(idMap.get("idRol"), Integer.class));
                columnas.put("id_permiso", normalizarValorEscalar(idMap.get("idPermiso"), Integer.class));
                ejecutarInsert("RolPermiso", null, "rol_permiso", columnas);
            }
            return;
        }

        SessionFactoryImplementor sfi = entityManager.getEntityManagerFactory().unwrap(SessionFactoryImplementor.class);
        EntityPersister persister = sfi.getMappingMetamodel().getEntityDescriptor(claseEntidad);
        String tabla = persister.getTableName();
        String idPropiedad = persister.getIdentifierPropertyName();
        String[] idColumnas = persister.getIdentifierColumnNames();

        for (Object reg : registros) {
            Map<String, Object> mapaReg = (Map<String, Object>) reg;

            LinkedHashMap<String, Object> columnas = new LinkedHashMap<>();
            Object idRegistro = null;

            if (idPropiedad != null && idColumnas.length == 1) {
                Class<?> claseId = persister.getIdentifierType().getReturnedClass();
                String claveIdJson = resolverClaveJson(claseEntidad, idPropiedad);
                idRegistro = normalizarValorEscalar(mapaReg.get(claveIdJson), claseId);
                columnas.put(idColumnas[0], idRegistro);
            }

            for (String prop : persister.getPropertyNames()) {
                org.hibernate.type.Type tipo = persister.getPropertyType(prop);
                if (tipo.isCollectionType()) continue; 

                String[] cols = persister.getPropertyColumnNames(prop);
                if (cols == null || cols.length != 1) continue;

                String claveJson = resolverClaveJson(claseEntidad, prop);
                Object valorJson = mapaReg.get(claveJson);
                Object valor;

                if (tipo.isEntityType()) {
                    valor = obtenerIdDeAsociacionDesdeMapa(sfi, valorJson, tipo);
                } else {
                    valor = normalizarValorEscalar(valorJson, tipo.getReturnedClass());
                }

                columnas.put(cols[0], valor);
            }

            ejecutarInsert(nombreEntidad, idRegistro, tabla, columnas);
        }

        if (idColumnas.length == 1) {
            reiniciarSecuencia(tabla, idColumnas[0]);
        }
    }

    private String resolverClaveJson(Class<?> claseEntidad, String propiedadHibernate) {
        Field campo = buscarCampo(claseEntidad, propiedadHibernate);
        if (campo != null) {
            JsonProperty anotacion = campo.getAnnotation(JsonProperty.class);
            if (anotacion != null && !anotacion.value().isBlank()) {
                return anotacion.value();
            }
        }
        return propiedadHibernate;
    }

    private Field buscarCampo(Class<?> clase, String nombreCampo) {
        Class<?> actual = clase;
        while (actual != null) {
            try {
                return actual.getDeclaredField(nombreCampo);
            } catch (NoSuchFieldException e) {
                actual = actual.getSuperclass();
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Object obtenerIdDeAsociacionDesdeMapa(SessionFactoryImplementor sfi, Object valorJson, org.hibernate.type.Type tipoAsociacion) {
        if (valorJson == null) return null;

        Class<?> claseAsociada = tipoAsociacion.getReturnedClass();
        EntityPersister persisterAsociado = sfi.getMappingMetamodel().getEntityDescriptor(claseAsociada);
        Class<?> claseId = persisterAsociado.getIdentifierType().getReturnedClass();

        if (valorJson instanceof Map) {
            String idPropiedadAsociada = persisterAsociado.getIdentifierPropertyName();
            if (idPropiedadAsociada == null) return null;
            String claveIdJson = resolverClaveJson(claseAsociada, idPropiedadAsociada);
            Object idValor = ((Map<String, Object>) valorJson).get(claveIdJson);
            return normalizarValorEscalar(idValor, claseId);
        }

        return normalizarValorEscalar(valorJson, claseId);
    }

    private Object normalizarValorEscalar(Object valor, Class<?> claseDestino) {
        if (valor == null || claseDestino == null) return valor;

        if (valor instanceof String) {
            String texto = (String) valor;
            if (claseDestino == LocalDateTime.class) return LocalDateTime.parse(texto);
            if (claseDestino == LocalDate.class) return LocalDate.parse(texto);
            if (claseDestino == LocalTime.class) return LocalTime.parse(texto);
            if (claseDestino == Timestamp.class) {
                try {
                    return Timestamp.from(Instant.parse(texto));
                } catch (DateTimeParseException ex) {
                    return Timestamp.valueOf(LocalDateTime.parse(texto));
                }
            }
            return texto;
        }

        if (valor instanceof Number) {
            Number numero = (Number) valor;
            if (claseDestino == Integer.class || claseDestino == int.class) return numero.intValue();
            if (claseDestino == Long.class || claseDestino == long.class) return numero.longValue();
            if (claseDestino == Short.class || claseDestino == short.class) return numero.shortValue();
            if (claseDestino == Double.class || claseDestino == double.class) return numero.doubleValue();
            if (claseDestino == Float.class || claseDestino == float.class) return numero.floatValue();
            if (claseDestino == BigDecimal.class) return new BigDecimal(numero.toString());
            return numero;
        }

        if (valor instanceof Enum<?>) {
            return ((Enum<?>) valor).name();
        }
        return valor;
    }

    @SuppressWarnings("unchecked")
    private Map<String, ColumnaInfo> obtenerInfoColumnas(String tabla) {
        return infoColumnasCache.computeIfAbsent(tabla.toLowerCase(), t -> {
            Map<String, ColumnaInfo> resultado = new HashMap<>();
            List<Object[]> filas = entityManager.createNativeQuery(
                "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns " +
                "WHERE table_schema = 'public' AND lower(table_name) = ?1"
            ).setParameter(1, t).getResultList();
            for (Object[] fila : filas) {
                String columna = ((String) fila[0]).toLowerCase();
                String tipoDato = (String) fila[1];
                boolean nullable = "YES".equalsIgnoreCase((String) fila[2]);
                boolean tieneDefault = fila[3] != null;
                resultado.put(columna, new ColumnaInfo(tipoDato, nullable, tieneDefault));
            }
            return resultado;
        });
    }

    private void ejecutarInsert(String nombreEntidad, Object idRegistro, String tabla, LinkedHashMap<String, Object> columnas) {
        if (columnas.isEmpty()) return;

        Map<String, ColumnaInfo> infoColumnas = obtenerInfoColumnas(tabla);

        // Si el respaldo no trae un valor para una columna obligatoria (por ejemplo, por haberse
        // generado con una versión anterior del sistema), evitamos que Postgres reviente con un
        // error críptico de "not-null constraint": si la columna tiene un valor por defecto en la
        // base de datos, la omitimos del INSERT para que se aplique ese default; si no tiene
        // default, cortamos acá con un mensaje claro en vez de dejar pasar un registro corrupto.
        LinkedHashMap<String, Object> columnasAInsertar = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : columnas.entrySet()) {
            String columna = entry.getKey();
            Object valor = entry.getValue();
            ColumnaInfo info = infoColumnas.get(columna.toLowerCase());

            if (valor == null && info != null && !info.nullable) {
                if (info.tieneDefault) {
                    continue;
                }
                String referencia = idRegistro != null ? " (registro con id " + idRegistro + ")" : "";
                throw new SolicitudInvalidaException(
                    "No se pudo restaurar el respaldo: el campo obligatorio '" + columna + "' de '" +
                    nombreEntidad + "'" + referencia + " llegó vacío en el archivo. " +
                    "Es posible que el respaldo se haya generado con una versión anterior del sistema. " +
                    "Generá un respaldo nuevo e intentá restaurar de nuevo."
                );
            }

            columnasAInsertar.put(columna, valor);
        }

        if (columnasAInsertar.isEmpty()) return;

        String cols = String.join(", ", columnasAInsertar.keySet());
        String placeholders = columnasAInsertar.keySet().stream().map(c -> "?").collect(Collectors.joining(", "));
        String sql = "INSERT INTO " + tabla + " (" + cols + ") VALUES (" + placeholders + ")";

        Session session = entityManager.unwrap(Session.class);
        session.doWork(connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                int i = 1;
                for (Map.Entry<String, Object> entry : columnasAInsertar.entrySet()) {
                    String columna = entry.getKey();
                    Object valor = entry.getValue();

                    if (valor == null) {
                        ps.setNull(i++, Types.OTHER);
                        continue;
                    }

                    ColumnaInfo info = infoColumnas.get(columna.toLowerCase());
                    String tipoSql = info != null ? info.tipoDato : null;
                    if (valor instanceof String && ("json".equalsIgnoreCase(tipoSql) || "jsonb".equalsIgnoreCase(tipoSql))) {
                        PGobject pgObject = new PGobject();
                        pgObject.setType(tipoSql.toLowerCase());
                        pgObject.setValue((String) valor);
                        ps.setObject(i++, pgObject);
                    } else {
                        ps.setObject(i++, valor);
                    }
                }
                ps.executeUpdate();
            }
        });
    }

    private void reiniciarSecuencia(String tabla, String columnaId) {
        try {
            entityManager.createNativeQuery(
                "SELECT setval(pg_get_serial_sequence('" + tabla + "','" + columnaId + "'), " +
                "COALESCE((SELECT MAX(" + columnaId + ") FROM " + tabla + "), 1))"
            ).getSingleResult();
        } catch (Exception e) {
            System.err.println("No se pudo reiniciar la secuencia de " + tabla + "." + columnaId + ": " + e.getMessage());
        }
    }
}