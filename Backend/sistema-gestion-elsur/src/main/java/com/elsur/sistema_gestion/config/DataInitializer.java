package com.elsur.sistema_gestion.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final TipoPersonaRepository tipoPersonaRepository;
    private final RolRepository rolRepository;
    private final ClienteRepository clienteRepository;
    private final JdbcTemplate jdbcTemplate; 

    public DataInitializer(TipoDocumentoRepository tipoDocumentoRepository,
                           TipoPersonaRepository tipoPersonaRepository,
                           RolRepository rolRepository,
                           ClienteRepository clienteRepository,
                           JdbcTemplate jdbcTemplate) {
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.tipoPersonaRepository = tipoPersonaRepository;
        this.rolRepository = rolRepository;
        this.clienteRepository = clienteRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override 
    public void run(String... args) throws Exception {
        System.out.println("[DataInitializer] Cargando datos maestros mediante SQL Nativo seguro...");

        // 1. TIPOS DE DOCUMENTO
        if (tipoDocumentoRepository.count() == 0) {
            jdbcTemplate.execute("INSERT INTO tipo_documento (id_tipo_documento, nombre_tipo) VALUES (1, 'DNI')");
            jdbcTemplate.execute("INSERT INTO tipo_documento (id_tipo_documento, nombre_tipo) VALUES (2, 'CUIT')");
            jdbcTemplate.execute("INSERT INTO tipo_documento (id_tipo_documento, nombre_tipo) VALUES (3, 'CUIL')");
            jdbcTemplate.execute("INSERT INTO tipo_documento (id_tipo_documento, nombre_tipo) VALUES (4, 'Pasaporte')");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('tipo_documento', 'id_tipo_documento'), 4)");
            System.out.println("[DataInitializer] -> Tipos de Documento insertados.");
        }

        // 2. TIPOS DE PERSONA
        if (tipoPersonaRepository.count() == 0) {
            jdbcTemplate.execute("INSERT INTO tipo_persona (id_tipo_persona, nombre_tipo) VALUES (1, 'Física')");
            jdbcTemplate.execute("INSERT INTO tipo_persona (id_tipo_persona, nombre_tipo) VALUES (2, 'Jurídica')");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('tipo_persona', 'id_tipo_persona'), 2)");
            System.out.println("[DataInitializer] -> Tipos de Persona insertados.");
        }

        // 3. ROLES (ADMIN y OPERARIO)
        if (rolRepository.count() == 0) {
            jdbcTemplate.execute("INSERT INTO rol (id_rol, nombre_rol) VALUES (1, 'ADMIN')");
            jdbcTemplate.execute("INSERT INTO rol (id_rol, nombre_rol) VALUES (2, 'OPERARIO')");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('rol', 'id_rol'), 2)");
            System.out.println("[DataInitializer] -> Roles insertados.");
        } else {
            jdbcTemplate.execute("UPDATE rol SET nombre_rol = 'OPERARIO' WHERE id_rol = 2 AND nombre_rol = 'EMPLEADO'");
        }

        // 4. CLIENTE CONSUMIDOR FINAL
        if (clienteRepository.count() == 0) {
            jdbcTemplate.execute("INSERT INTO persona (id_persona, nombre, apellido, numero_documento, id_tipo_documento, id_tipo_persona) " +
                    "VALUES (1, 'Consumidor', 'Final', '99999999', 1, 1)");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('persona', 'id_persona'), 1)");

            jdbcTemplate.execute("INSERT INTO cliente (id_cliente, razon_social, saldo_deudor, limite_credito, estado, condicion_de_pago, persona_de_contacto, id_persona) " +
                    "VALUES (1, 'Consumidor Final', 0.00, 0.00, 'Activo', 'Contado', 'N/A', 1)");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('cliente', 'id_cliente'), 1)");
            System.out.println("[DataInitializer] -> Cliente 'Consumidor Final' insertado exitosamente.");
        }

        // 5. PERMISOS Y MÓDULOS DEL SISTEMA
        // Actualiza registros existentes de "Inventario" a "Equipos / Máquinas"
        jdbcTemplate.execute("UPDATE permiso SET nombre_permiso = 'Equipos / Máquinas' WHERE nombre_permiso = 'Inventario'");

        Long totalPermisos = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM permiso", Long.class);
        if (totalPermisos == null || totalPermisos == 0) {
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (1, 'Panel Principal')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (2, 'Crear Pedido')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (3, 'Pedidos Pendientes')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (4, 'Historial de Pedidos')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (5, 'Caja')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (6, 'Repositorio Digital')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (7, 'Equipos / Máquinas')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (8, 'Insumos')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (9, 'Productos')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (10, 'Clientes')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (11, 'Proveedores')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (12, 'Informes')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (13, 'Matriz de Permisos')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (14, 'Gestión de Usuarios')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (15, 'Historial de Actividad')");
            jdbcTemplate.execute("INSERT INTO permiso (id_permiso, nombre_permiso) VALUES (16, 'Configuración')");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('permiso', 'id_permiso'), 16)");
            System.out.println("[DataInitializer] -> Permisos / Módulos insertados.");
        }

        // 6. ASIGNACIÓN INICIAL DE PERMISOS A ROLES (ROL_PERMISO)
        Long totalRolPermiso = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rol_permiso", Long.class);
        if (totalRolPermiso == null || totalRolPermiso == 0) {
            jdbcTemplate.execute("INSERT INTO rol_permiso (id_rol, id_permiso) SELECT 1, id_permiso FROM permiso ON CONFLICT DO NOTHING");

            int[] permisosOperario = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16};
            for (int idPermiso : permisosOperario) {
                jdbcTemplate.execute("INSERT INTO rol_permiso (id_rol, id_permiso) VALUES (2, " + idPermiso + ") ON CONFLICT DO NOTHING");
            }
            System.out.println("[DataInitializer] -> Relaciones Rol-Permiso inicializadas.");
        }

        System.out.println("[DataInitializer] Sincronización completada con éxito.");
    }
}