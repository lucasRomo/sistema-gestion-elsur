package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.elsur.sistema_gestion.models.MovimientoCaja;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Service
public class TurnoServiceImpl implements TurnoService {

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private MovimientoCajaRepository MovimientoCajaRepository ;

    @Autowired
    private UsuarioRepository UsuarioRepository;

    @Override
    public Turno abrirTurno(Turno turno) {
        if (existeTurnoAbiertoHoy()) {
            throw new RuntimeException("¡Error! Ya existe una caja abierta en este momento.");
        }
        turno.setFechaApertura(LocalDateTime.now());    
        turno.setEstado(EstadoTurno.ABIERTO);
        
        // Seteamos inicialmente el monto esperado igual al monto con el que inicia
        turno.setMontoEsperadoSistema(turno.getMontoInicial()); 
        turno.setDiferenciaArqueo(0.0);

        return turnoRepository.save(turno);
    }

    @Override
    public Turno cerrarTurno(Integer idTurno, Double montoReal, String observaciones, Integer idUsuario) {
    Turno turno = turnoRepository.findById(idTurno)
            .orElseThrow(() -> new RuntimeException("No se encontró el turno con ID: " + idTurno));

    turno.setEstado(EstadoTurno.CERRADO);
    turno.setFechaCierre(LocalDateTime.now());
    turno.setMontoRealContado(montoReal);

    List<MovimientoCaja> movimientosTurno = MovimientoCajaRepository.findByTurno_IdTurno(idTurno);

    double totalIngresos = movimientosTurno.stream()
            .filter(m -> "INGRESO".equals(m.getTipoMovimiento()))
            .mapToDouble(m -> m.getMonto().doubleValue())
            .sum();

    double totalEgresos = movimientosTurno.stream()
            .filter(m -> "EGRESO".equals(m.getTipoMovimiento()))
            .mapToDouble(m -> m.getMonto().doubleValue())
            .sum();

    double esperado = turno.getMontoInicial() + totalIngresos - totalEgresos;
    turno.setMontoEsperadoSistema(esperado);

    turno.setDiferenciaArqueo(montoReal - esperado);

    turno.setObservaciones(observaciones);

    if (idUsuario != null) {
        UsuarioRepository.findById(idUsuario).ifPresent(turno::setUsuario);
    }

    return turnoRepository.save(turno);
    }
    
    @Override
    public Optional<Turno> obtenerTurnoAbiertoHoy() {
        // Busca el turno activo usando el estado ABIERTO
        return turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO);
    }

    @Override
    public boolean existeTurnoAbiertoHoy() {
        return obtenerTurnoAbiertoHoy().isPresent();
    }

    @Override
    public List<Turno> obtenerTodos() {
    return turnoRepository.findAllByOrderByFechaAperturaDesc();
    }
}