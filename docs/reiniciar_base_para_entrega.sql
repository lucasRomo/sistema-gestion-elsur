-- =====================================================================================
-- REINICIAR LA BASE PARA ENTREGAR EL SISTEMA (deja todo vacío, como recién instalado)
-- =====================================================================================
-- Hace lo mismo que poner spring.jpa.hibernate.ddl-auto=create, pero UNA sola vez:
-- con "create" en el properties la base se borraría cada vez que Render reinicia el backend
-- (cada deploy y cada vez que se despierta), y la empresa perdería sus datos.
--
-- Cómo usarlo:
--   1. (Opcional) Descargar un respaldo desde Configuración, por las dudas.
--   2. Supabase -> SQL Editor -> pegar TODO este archivo -> Run.
--   3. Render -> el servicio del backend -> Manual Deploy -> "Restart service"
--      (al arrancar vuelve a cargar roles, permisos, tipos de documento y Consumidor Final).
--   4. La primera persona que se registre queda como ADMINISTRADOR (activo).
--
-- Vacía TODAS las tablas del esquema public y reinicia los números (el primer pedido es el #1).
-- No toca la estructura de las tablas ni los archivos de Supabase Storage: los comprobantes,
-- documentos y respaldos viejos se borran aparte desde Storage -> cada bucket -> seleccionar todo.
-- =====================================================================================

DO $$
DECLARE
    tablas text;
BEGIN
    SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
      INTO tablas
      FROM pg_tables
     WHERE schemaname = 'public';

    IF tablas IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tablas || ' RESTART IDENTITY CASCADE';
    END IF;
END $$;

-- Comprobación: todas las tablas deberían dar 0.
SELECT relname AS tabla, n_live_tup AS filas_aprox
  FROM pg_stat_user_tables
 WHERE schemaname = 'public'
 ORDER BY relname;
