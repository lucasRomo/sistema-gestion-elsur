package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    boolean existsByPersonaEmail(String email);
    boolean existsByPersonaNumeroDocumento(String numeroDocumento);
    boolean existsByNombreUsuario(String nombreUsuario);
    // Agregado para poder identificar A QUIÉN pertenece un DNI ya registrado
    // (no solo si existe): necesario para el chequeo de duplicado en
    // UsuarioServiceImpl.guardar(), que debe distinguir "es otra persona" de
    // "es la misma persona que se está editando" -- igual que ya se hace con
    // findByNombreUsuario más arriba.
    Optional<Usuario> findByPersonaNumeroDocumento(String numeroDocumento);
}