package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Integer> {
    
    // Para ver todas las incidencias de una máquina específica (ej: la Ricoh)
    List<Incidencia> findByMaquinaIdMaquinaOrderByFechaReporteDesc(Integer idMaquina);
}