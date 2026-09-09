package com.elsur.sistema_gestion.services.impl;

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

    // Cache de "tabla -> (columna -> tipo SQL)" para detectar columnas json/jsonb
    // sin tener que consultar el catálogo de Postgres en cada INSERT.
    private final Map<String, Map<String, String>> tiposColumnaCache = new HashMap<>();

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private abstract static class HibernateProxyMixIn {}

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
                .orElseThrow(() -> new RuntimeException("Respaldo no encontrado con ID: " + idRespaldo));

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
                .orElseThrow(() -> new RuntimeException("Respaldo no encontrado con ID: " + idRespaldo));

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
                throw new RuntimeException("Formato de respaldo inválido: no se encontró el nodo 'datos'.");
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

    /**
     * Restaura una lista de registros de una entidad leyendo los valores
     * directamente del Map genérico ya parseado (nunca reconstruye la
     * entidad Java completa con Jackson). Esto evita por completo el bug de
     * Jackson al resolver grafos de objetos con referencias circulares
     * (ej: DetallePedido -> Pedido -> movimientos -> ... -> Pedido).
     */
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
                ejecutarInsert("rol_permiso", columnas);
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

            if (idPropiedad != null && idColumnas.length == 1) {
                Class<?> claseId = persister.getIdentifierType().getReturnedClass();
                String claveIdJson = resolverClaveJson(claseEntidad, idPropiedad);
                columnas.put(idColumnas[0], normalizarValorEscalar(mapaReg.get(claveIdJson), claseId));
            }

            for (String prop : persister.getPropertyNames()) {
                org.hibernate.type.Type tipo = persister.getPropertyType(prop);
                if (tipo.isCollectionType()) continue; // @OneToMany/@ManyToMany: no son columna propia

                String[] cols = persister.getPropertyColumnNames(prop);
                if (cols == null || cols.length != 1) continue;

                String claveJson = resolverClaveJson(claseEntidad, prop);
                Object valorJson = mapaReg.get(claveJson);
                Object valor;

                // Se pregunta al propio mapeo de Hibernate si esta propiedad es
                // una relación hacia otra entidad (en vez de adivinarlo por el
                // objeto en tiempo de ejecución) — así cubre TODAS las
                // relaciones sin depender de heurísticas frágiles.
                if (tipo.isEntityType()) {
                    valor = obtenerIdDeAsociacionDesdeMapa(sfi, valorJson, tipo);
                } else {
                    valor = normalizarValorEscalar(valorJson, tipo.getReturnedClass());
                }

                columnas.put(cols[0], valor);
            }

            ejecutarInsert(tabla, columnas);
        }

        if (idColumnas.length == 1) {
            reiniciarSecuencia(tabla, idColumnas[0]);
        }
    }

    /**
     * Devuelve la clave real que usó Jackson para esta propiedad en el JSON.
     * Por defecto es el mismo nombre que usa Hibernate/JPA, PERO si el campo
     * tiene @JsonProperty("otro_nombre") (como Cliente.idCliente, que se
     * serializa como "id_cliente"), Jackson usó ESE nombre como clave del
     * Map, no el nombre del campo Java. Sin este ajuste, mapaReg.get(...)
     * busca una clave que no existe y devuelve null silenciosamente.
     */
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

    /**
     * Resuelve el ID de una relación ManyToOne/OneToOne a partir del valor
     * que haya quedado en el JSON para esa propiedad. Contempla dos formas
     * posibles en las que puede venir:
     *  - Como objeto anidado completo (Map): se extrae el ID de ese mapa,
     *    usando también la clave JSON real (@JsonProperty) del ID de la
     *    entidad asociada, no solo el nombre de Hibernate.
     *  - Como valor plano (Integer/Long/String): ya es el ID directamente.
     */
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

        // Ya viene como valor plano (referencia por ID)
        return normalizarValorEscalar(valorJson, claseId);
    }

    /**
     * Convierte un valor tal cual quedó tras el parseo genérico a Map/List
     * (Strings, Numbers, Booleans) al tipo Java que espera la columna, para
     * que el driver de PostgreSQL pueda inferir el tipo SQL correcto en
     * setObject(). Sin esto, fechas y enums (que en JSON son solo texto)
     * llegarían como String crudo y Postgres podría rechazarlos o
     * interpretarlos mal según la columna de destino.
     */
    private Object normalizarValorEscalar(Object valor, Class<?> claseDestino) {
        if (valor == null || claseDestino == null) return valor;

        if (valor instanceof String) {
            String texto = (String) valor;
            if (claseDestino == LocalDateTime.class) return LocalDateTime.parse(texto);
            if (claseDestino == LocalDate.class) return LocalDate.parse(texto);
            if (claseDestino == LocalTime.class) return LocalTime.parse(texto);
            if (claseDestino == Timestamp.class) {
                // Campos mapeados como java.sql.Timestamp (en vez de
                // LocalDateTime) pueden haberse serializado con offset/"Z"
                // (ej: @JsonFormat con timezone UTC -> "...SSSXXX"). Postgres
                // no castea implícitamente ese formato a
                // "timestamp without time zone", así que lo parseamos acá
                // antes de mandarlo al driver.
                try {
                    return Timestamp.from(Instant.parse(texto));
                } catch (DateTimeParseException ex) {
                    // Por si en algún backup viejo/otro campo llega sin
                    // offset (formato "yyyy-MM-ddTHH:mm:ss[.SSS]").
                    return Timestamp.valueOf(LocalDateTime.parse(texto));
                }
            }
            // Enums (@Enumerated(EnumType.STRING)) y el resto de los Strings
            // ya vienen en el formato que espera la columna VARCHAR/TEXT.
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
            // Por si en algún punto llega un enum "real" (no debería, ya que
            // todo pasa por Map/JSON), se guarda igual como texto.
            return ((Enum<?>) valor).name();
        }

        // Boolean u otros tipos ya vienen en un formato que el driver entiende
        return valor;
    }

    /**
     * Consulta (con cache) el tipo SQL real de una columna de Postgres, para
     * poder detectar columnas json/jsonb. Sin esto, un String plano viaja al
     * driver como VARCHAR y Postgres rechaza el INSERT porque no castea
     * automáticamente texto a json/jsonb en parámetros de PreparedStatement.
     */
    @SuppressWarnings("unchecked")
    private String obtenerTipoColumna(String tabla, String columna) {
        Map<String, String> columnasTabla = tiposColumnaCache.computeIfAbsent(tabla.toLowerCase(), t -> {
            Map<String, String> resultado = new HashMap<>();
            List<Object[]> filas = entityManager.createNativeQuery(
                "SELECT column_name, data_type FROM information_schema.columns " +
                "WHERE table_schema = 'public' AND lower(table_name) = ?1"
            ).setParameter(1, t).getResultList();
            for (Object[] fila : filas) {
                resultado.put(((String) fila[0]).toLowerCase(), (String) fila[1]);
            }
            return resultado;
        });
        return columnasTabla.get(columna.toLowerCase());
    }

    private void ejecutarInsert(String tabla, LinkedHashMap<String, Object> columnas) {
        if (columnas.isEmpty()) return;
        String cols = String.join(", ", columnas.keySet());
        String placeholders = columnas.keySet().stream().map(c -> "?").collect(Collectors.joining(", "));
        String sql = "INSERT INTO " + tabla + " (" + cols + ") VALUES (" + placeholders + ")";

        Session session = entityManager.unwrap(Session.class);
        session.doWork(connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                int i = 1;
                for (Map.Entry<String, Object> entry : columnas.entrySet()) {
                    String columna = entry.getKey();
                    Object valor = entry.getValue();

                    if (valor == null) {
                        ps.setNull(i++, Types.OTHER);
                        continue;
                    }

                    String tipoSql = obtenerTipoColumna(tabla, columna);
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