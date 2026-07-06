package com.elsur.sistema_gestion.repositories;


import com.elsur.sistema_gestion.models.RegistroActividad;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistroActividadRepository extends JpaRepository<RegistroActividad, Integer> {
  
}