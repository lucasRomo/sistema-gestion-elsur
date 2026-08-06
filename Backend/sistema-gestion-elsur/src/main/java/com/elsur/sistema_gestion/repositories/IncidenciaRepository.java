package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Integer> {
    List<Incidencia> findByMaquinaIdMaquinaOrderByFechaReporteDesc(Integer idMaquina);
    List<Incidencia> findByMaquinaIdMaquinaAndEstadoIncidencia(Integer idMaquina, String estadoIncidencia);
}