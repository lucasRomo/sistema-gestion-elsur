package com.elsur.sistema_gestion.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.elsur.sistema_gestion.models.Institucion;

public interface InstitucionRepository extends JpaRepository<Institucion, Long> {
}