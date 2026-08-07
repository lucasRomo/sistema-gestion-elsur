package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Integer> {

    // 1. Verifica si existe algún turno con el estado enviado (ej. ABIERTO) en el día actual
    @Query("SELECT COUNT(t) > 0 FROM Turno t WHERE t.estado = :estado AND FUNCTION('DATE', t.fechaApertura) = CURRENT_DATE")
    boolean existsByEstadoAndFechaAperturaToday(@Param("estado") EstadoTurno estado);

    // 2. Verifica si ya se realizó un cierre en el día actual
    @Query("SELECT COUNT(t) > 0 FROM Turno t WHERE t.estado = :estado AND FUNCTION('DATE', t.fechaCierre) = CURRENT_DATE")
    boolean existsByEstadoAndFechaCierreToday(@Param("estado") EstadoTurno estado);

    // Opcional: Para obtener el turno abierto actual si necesitas hacer operaciones con él
    @Query("SELECT t FROM Turno t WHERE t.estado = 'ABIERTO' AND FUNCTION('DATE', t.fechaApertura) = CURRENT_DATE")
    Turno findTurnoAbiertoHoy();

    Optional<Turno> findFirstByFechaCierreIsNull();

    Optional<Turno> findFirstByEstado(EstadoTurno estado);

    // Método agregado para buscar el último turno por EstadoTurno
    Optional<Turno> findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno estado);
}