package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    Optional<Persona> findByNumeroDocumento(String numeroDocumento);
}