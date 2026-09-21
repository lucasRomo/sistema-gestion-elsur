package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Integer> {

    @Query("SELECT COUNT(t) > 0 FROM Turno t WHERE t.estado = :estado AND FUNCTION('DATE', t.fechaApertura) = CURRENT_DATE")
    boolean existsByEstadoAndFechaAperturaToday(@Param("estado") EstadoTurno estado);

    @Query("SELECT COUNT(t) > 0 FROM Turno t WHERE t.estado = :estado AND FUNCTION('DATE', t.fechaCierre) = CURRENT_DATE")
    boolean existsByEstadoAndFechaCierreToday(@Param("estado") EstadoTurno estado);

    @Query("SELECT t FROM Turno t WHERE t.estado = 'ABIERTO' AND FUNCTION('DATE', t.fechaApertura) = CURRENT_DATE")
    Turno findTurnoAbiertoHoy();

    boolean existsByEstado(EstadoTurno estado);

    Optional<Turno> findFirstByFechaCierreIsNull();

    Optional<Turno> findFirstByEstado(EstadoTurno estado);

      List<Turno> findAllByOrderByFechaAperturaDesc();

    Optional<Turno> findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno estado);
}