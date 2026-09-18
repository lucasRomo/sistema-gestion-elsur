package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {
    // Usado para bloquear la creación de perfiles con nombres duplicados
    // (case-insensitive: "cajero" y "CAJERO" deben considerarse el mismo nombre).
    Optional<Rol> findByNombreRolIgnoreCase(String nombreRol);

    // Perfiles "PERFIL_<usuario>" (personalizados) que no tienen NINGÚN usuario
    // apuntándolos hoy -- roles huérfanos que quedaron invisibles para la UI
    // porque matrizPermisosService.obtenerRoles() filtra todo lo que empiece
    // con "PERFIL_" antes de mostrar el selector de perfiles globales.
    @org.springframework.data.jpa.repository.Query(
        "SELECT r FROM Rol r WHERE r.nombreRol LIKE 'PERFIL\\_%' ESCAPE '\\' " +
        "AND NOT EXISTS (SELECT u FROM Usuario u WHERE u.rol = r)")
    List<Rol> findPerfilesPersonalizadosHuerfanos();
}