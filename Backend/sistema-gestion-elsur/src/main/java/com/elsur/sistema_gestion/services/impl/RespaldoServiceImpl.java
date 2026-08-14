package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.RespaldoLogRepository;
import com.elsur.sistema_gestion.services.RespaldoService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RespaldoServiceImpl implements RespaldoService {

    @Autowired
    private RespaldoLogRepository respaldoLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

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
            
            Path directorioBackups = Paths.get("backups");
            if (!Files.exists(directorioBackups)) {
                Files.createDirectories(directorioBackups);
            }
            
            Path rutaArchivo = directorioBackups.resolve(fileName);
            Files.write(rutaArchivo, bytes);

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
            Path rutaArchivo = Paths.get("backups").resolve(log.getNombreArchivo());
            Files.deleteIfExists(rutaArchivo);
        } catch (Exception e) {
            System.err.println("No se pudo eliminar el archivo físico: " + e.getMessage());
        }

        respaldoLogRepository.deleteById(idRespaldo);
    }

    @Override
    public byte[] descargarRespaldoPorId(Integer idRespaldo) {
        RespaldoLog log = respaldoLogRepository.findById(idRespaldo)
                .orElseThrow(() -> new RuntimeException("Respaldo no encontrado con ID: " + idRespaldo));

        try {
            Path rutaArchivo = Paths.get("backups").resolve(log.getNombreArchivo());
            if (!Files.exists(rutaArchivo)) {
                throw new RuntimeException("El archivo físico no existe en el servidor.");
            }
            return Files.readAllBytes(rutaArchivo);
        } catch (Exception e) {
            throw new RuntimeException("Error al leer el archivo de respaldo: " + e.getMessage(), e);
        }
    }

    @Transactional
    @Override
    public void restaurarRespaldo(MultipartFile archivo) {
        try {
            // Desactivar temporalmente el chequeo de Foreign Keys en la sesión de la BD
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            Map<String, Object> root = objectMapper.readValue(archivo.getInputStream(), Map.class);
            Map<String, Object> datos = (Map<String, Object>) root.get("datos");

            if (datos == null) {
                throw new RuntimeException("Formato de respaldo inválido: no se encontró el nodo 'datos'.");
            }

            // 1. Omitir entidades asociadas que se manejan en cascada por su entidad padre
            List<String> entidadesOmitidas = List.of(
                "RespaldoLog", "DetallePedido", "AsignacionPedido", "ComprobantePago", "HistorialEstadoPedido"
            );

            // 2. Orden estrictamente jerárquico según las dependencias de la BD
            List<String> ordenEntidades = List.of(
                // Catálogos y Tablas Maestras Primarias (sin dependencias)
                "TipoDocumento", "TipoPersona", "TipoProveedor", "EstadoTurno", 
                "UnidadMedida", "Permiso", "Rol", "Categoria", "categoriaCliente", 
                "Institucion", "Area_Curso", "Direccion",
                
                // Personas y Roles de Sistema
                "Persona", "RolPermiso", "Usuario", "Empleado", "Cliente", "Proveedor",
                
                // Inventarios, Máquinas y Productos
                "Insumo", "Maquina", "Producto", "ProductoInsumo",
                
                // Transacciones Operativas
                "Turno", "Incidencia", "CompraProveedor", "DetalleCompraInsumo", 
                "Merma", "MermaInsumo", "Pedido", "Factura", 
                "MovimientoCaja", "MovimientoCuentaCorriente", "DocumentoDigital", "RegistroActividad"
            );

            Map<String, EntityType<?>> metamodelMap = entityManager.getMetamodel().getEntities().stream()
                .collect(Collectors.toMap(EntityType::getName, e -> e, (e1, e2) -> e1));

            // Procesar en orden estricto de jerarquía
            for (String nombreEntidad : ordenEntidades) {
                if (datos.containsKey(nombreEntidad) && metamodelMap.containsKey(nombreEntidad)) {
                    restaurarListaEntidad(objectMapper, datos.get(nombreEntidad), metamodelMap.get(nombreEntidad));
                }
            }

            // Procesar cualquier entidad restando que no esté en las listas explícitas
            for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
                String nombreEntidad = entity.getName();
                if (!ordenEntidades.contains(nombreEntidad) && !entidadesOmitidas.contains(nombreEntidad) && datos.containsKey(nombreEntidad)) {
                    restaurarListaEntidad(objectMapper, datos.get(nombreEntidad), entity);
                }
            }

            entityManager.flush();
        } catch (Exception e) {
            throw new RuntimeException("Error al restaurar los datos: " + e.getMessage(), e);
        } finally {
            // Reactivar el chequeo de Foreign Keys
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
        }
    }

    private void restaurarListaEntidad(ObjectMapper objectMapper, Object listaRegistros, EntityType<?> entity) throws Exception {
        if (listaRegistros instanceof List) {
            List<?> registros = (List<?>) listaRegistros;
            for (Object reg : registros) {
                String jsonReg = objectMapper.writeValueAsString(reg);
                Object entidadInstancia = objectMapper.readValue(jsonReg, entity.getJavaType());

                // Reconectar referencias bidireccionales de Pedido
                if (entidadInstancia instanceof Pedido pedido) {
                    if (pedido.getDetalles() != null) {
                        pedido.getDetalles().forEach(d -> d.setPedido(pedido));
                    }
                    if (pedido.getAsignaciones() != null) {
                        pedido.getAsignaciones().forEach(a -> a.setPedido(pedido));
                    }
                    if (pedido.getComprobantes() != null) {
                        pedido.getComprobantes().forEach(c -> c.setPedido(pedido));
                    }
                    if (pedido.getHistoriales() != null) {
                        pedido.getHistoriales().forEach(h -> h.setPedido(pedido));
                    }
                }

                entityManager.merge(entidadInstancia);
            }
        }
    }
}