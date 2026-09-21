package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.repositories.PermisoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;


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
