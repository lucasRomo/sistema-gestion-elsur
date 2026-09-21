package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    Optional<Rol> findByNombreRolIgnoreCase(String nombreRol);

    @org.springframework.data.jpa.repository.Query(
        "SELECT r FROM Rol r WHERE r.nombreRol LIKE 'PERFIL\\_%' ESCAPE '\\' " +
        "AND NOT EXISTS (SELECT u FROM Usuario u WHERE u.rol = r)")
    List<Rol> findPerfilesPersonalizadosHuerfanos();
}