package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {

    Optional<Empleado> findByPersona_IdPersona(Integer idPersona);
}