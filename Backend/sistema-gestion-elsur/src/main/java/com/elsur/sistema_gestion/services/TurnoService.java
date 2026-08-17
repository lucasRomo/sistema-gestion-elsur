package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Turno;

import java.util.Optional;

import java.util.List;

public interface TurnoService {

    Turno abrirTurno(Turno turno);

    Turno cerrarTurno(Integer idTurno, Double montoReal, String observaciones, Integer idUsuario);

    Optional<Turno> obtenerTurnoAbiertoHoy();

    boolean existeTurnoAbiertoHoy();

    List<Turno> obtenerTodos();
}