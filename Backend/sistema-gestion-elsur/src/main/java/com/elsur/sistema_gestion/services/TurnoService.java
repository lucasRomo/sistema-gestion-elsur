package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Turno;

import java.util.Optional;

public interface TurnoService {
    
    Turno abrirTurno(Turno turno);

    boolean existeTurnoAbiertoHoy();

    Turno cerrarTurno(Integer idTurno, Double montoReal);

    Optional<Turno> obtenerTurnoAbiertoHoy();
}