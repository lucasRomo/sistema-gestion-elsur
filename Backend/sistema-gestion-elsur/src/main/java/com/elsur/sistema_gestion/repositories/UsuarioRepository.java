package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    boolean existsByPersonaEmail(String email);
    boolean existsByPersonaNumeroDocumento(String numeroDocumento);
    boolean existsByNombreUsuario(String nombreUsuario);
}