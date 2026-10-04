package com.elsur.sistema_gestion.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Optimización para Supabase (Postgres): Postgres NO crea índices automáticamente sobre las
 * claves foráneas, así que consultas como "historiales/detalles/comprobantes WHERE id_pedido IN (...)"
 * recorrían la tabla entera. Al arrancar, busca cada clave foránea sin índice y lo crea.
 *
 * Se hace leyendo el catálogo de Postgres (no con nombres fijos) porque las tablas del script
 * original (ej. "detallepedido") y las que crea Hibernate (ej. "detalle_pedido") se llaman distinto.
 * Es idempotente: si los índices ya existen no hace nada.
 */
@Component
@Profile("!test")
public class IndicesBaseDatosInitializer implements CommandLineRunner {

    private static final String CREAR_INDICES_FK = """
        DO $$
        DECLARE r RECORD;
        BEGIN
          FOR r IN
            SELECT c.conrelid::regclass AS tabla,
                   rel.relname AS nombre_tabla,
                   a.attname AS columna
            FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
            WHERE c.contype = 'f'
              AND array_length(c.conkey, 1) = 1
              AND rel.relnamespace = 'public'::regnamespace
              AND NOT EXISTS (
                SELECT 1 FROM pg_index i
                WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]
              )
          LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)',
                           left('idx_' || r.nombre_tabla || '_' || r.columna, 63), r.tabla, r.columna);
          END LOOP;
        END $$;
        """;

    // La cola del taller y el historial filtran pedidos por estado en cada carga.
    private static final String CREAR_INDICE_ESTADO_PEDIDO = """
        DO $$
        BEGIN
          IF to_regclass('public.pedido') IS NOT NULL THEN
            CREATE INDEX IF NOT EXISTS idx_pedido_estado ON public.pedido (estado);
          END IF;
        END $$;
        """;

    private final JdbcTemplate jdbcTemplate;

    public IndicesBaseDatosInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            String motor = jdbcTemplate.execute(
                    (java.sql.Connection con) -> con.getMetaData().getDatabaseProductName());
            if (motor == null || !motor.toLowerCase().contains("postgres")) {
                return;
            }
            jdbcTemplate.execute(CREAR_INDICES_FK);
            jdbcTemplate.execute(CREAR_INDICE_ESTADO_PEDIDO);
        } catch (Exception e) {
            // Nunca impedir que el sistema arranque por esto: los índices son solo optimización.
            System.err.println("[IndicesBaseDatos] No se pudieron verificar/crear los índices: " + e.getMessage());
        }
    }
}
