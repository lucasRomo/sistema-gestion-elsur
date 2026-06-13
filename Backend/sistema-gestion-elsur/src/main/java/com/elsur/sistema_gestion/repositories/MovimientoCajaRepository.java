package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.MovimientoCaja;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Integer> {
    List<MovimientoCaja> findByCajaId(Integer cajaId);
}