package com.elsur.sistema_gestion.repositories;
import com.elsur.sistema_gestion.models.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpleadoRepository extends JpaRepository<Empleado, Integer> {}