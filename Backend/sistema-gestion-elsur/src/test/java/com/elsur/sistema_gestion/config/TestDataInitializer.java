package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.repositories.PermisoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Reemplazo de DataInitializer SOLO para el perfil "test" (activo automáticamente en
 * cualquier @SpringBootTest -- ver src/test/resources/application.properties). El
 * DataInitializer real corre SQL nativo de Postgres (pg_get_serial_sequence, ON
 * CONFLICT DO NOTHING) que no existe en la base H2 en memoria que usan los tests, así
 * que se excluye acá con @Profile("!test") sobre DataInitializer y este lo sustituye
 * con el mínimo portable (JPA puro, nada de SQL nativo) que necesitan los tests de
 * integración: la lista de Permiso por nombre.
 *
 * Ahora mismo el único consumidor es MatrizSeguridadValidatorIntegrationTest, que arma
 * roles de prueba buscando permisos existentes por nombre
 * (permisoRepository.findAll().stream().filter(...)) -- si esta lista está vacía, todos
 * esos tests fallarían (ningún rol de prueba tendría permisos para conceder acceso).
 * Los nombres tienen que coincidir EXACTO con los que siembra DataInitializer en
 * producción (incluida la corrección "Inventario" -> "Equipos / Máquinas"), para que
 * este entorno de test refleje el real.
 */
@Component
@Profile("test")
public class TestDataInitializer implements CommandLineRunner {

    private final PermisoRepository permisoRepository;

    public TestDataInitializer(PermisoRepository permisoRepository) {
        this.permisoRepository = permisoRepository;
    }

    @Override
    public void run(String... args) {
        if (permisoRepository.count() > 0) {
            return;
        }

        List<String> nombresPermisos = List.of(
                "Panel Principal",
                "Crear Pedido",
                "Pedidos Pendientes",
                "Historial de Pedidos",
                "Caja",
                "Repositorio Digital",
                "Equipos / Máquinas",
                "Insumos",
                "Productos",
                "Clientes",
                "Proveedores",
                "Informes",
                "Matriz de Permisos",
                "Gestión de Usuarios",
                "Historial de Actividad",
                "Configuración",
                "Compra de Insumos");

        for (String nombre : nombresPermisos) {
            Permiso permiso = new Permiso();
            permiso.setNombrePermiso(nombre);
            permisoRepository.save(permiso);
        }

        System.out.println("[TestDataInitializer] -> " + nombresPermisos.size()
                + " permisos de prueba sembrados en la base H2 en memoria.");
    }
}
