package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaquinaRepository extends JpaRepository<Maquina, Integer> {
    boolean existsByNombreIgnoreCase(String nombre);
}