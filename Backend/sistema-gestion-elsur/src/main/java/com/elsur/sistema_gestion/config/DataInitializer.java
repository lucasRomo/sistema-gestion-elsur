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

        // 3. ROLES
        if (rolRepository.count() == 0) {
            jdbcTemplate.execute("INSERT INTO rol (id_rol, nombre_rol) VALUES (1, 'ADMIN')");
            jdbcTemplate.execute("INSERT INTO rol (id_rol, nombre_rol) VALUES (2, 'EMPLEADO')");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('rol', 'id_rol'), 2)");
            System.out.println("[DataInitializer] -> Roles insertados.");
        }

        // 4. CLIENTE CONSUMIDOR FINAL (Carga por SQL Nativo para evitar fallos de ID)
        if (clienteRepository.count() == 0) {
            // Primero insertamos la Persona asociada (ID: 1)
            jdbcTemplate.execute("INSERT INTO persona (id_persona, nombre, apellido, numero_documento, id_tipo_documento, id_tipo_persona) " +
                    "VALUES (1, 'Consumidor', 'Final', '99999999', 1, 1)");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('persona', 'id_persona'), 1)");
            System.out.println("[DataInitializer] -> Persona 'Consumidor Final' insertada.");

            // Ahora insertamos el Cliente (ID: 1) apuntando a esa Persona
            jdbcTemplate.execute("INSERT INTO cliente (id_cliente, razon_social, saldo_deudor, limite_credito, estado, condicion_de_pago, persona_de_contacto, id_persona) " +
                    "VALUES (1, 'Consumidor Final', 0.00, 0.00, 'Activo', 'Contado', 'N/A', 1)");
            jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('cliente', 'id_cliente'), 1)");
            System.out.println("[DataInitializer] -> Cliente 'Consumidor Final' insertado exitosamente.");
        }

        System.out.println("[DataInitializer] ¡Sincronización terminada con éxito sin bloqueos de Hibernate!");
    }
}