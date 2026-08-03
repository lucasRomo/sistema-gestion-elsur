package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Institucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstitucionRepository extends JpaRepository<Institucion, Long> {
}