package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import com.elsur.sistema_gestion.services.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Service
public class TurnoServiceImpl implements TurnoService {

    @Autowired
    private TurnoRepository turnoRepository;

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
    public Turno cerrarTurno(Integer idTurno, Double montoReal, String observaciones) {
        Turno turno = turnoRepository.findById(idTurno)
                .orElseThrow(() -> new RuntimeException("No se encontró el turno con ID: " + idTurno));

        // Cambiamos el estado y registramos la fecha de cierre
        turno.setEstado(EstadoTurno.CERRADO);
        turno.setFechaCierre(LocalDateTime.now());
        turno.setMontoRealContado(montoReal);

        // Calculamos el monto esperado. Si está en null, tomamos provisoriamente el montoInicial.
        double esperado = (turno.getMontoEsperadoSistema() != null) 
                ? turno.getMontoEsperadoSistema() 
                : turno.getMontoInicial();
        
        turno.setMontoEsperadoSistema(esperado);

        // Calculamos la diferencia del arqueo (Real ingresado - Esperado por sistema)
        turno.setDiferenciaArqueo(montoReal - esperado);
        
        // Asignamos la justificación/observación ingresada en el frontend
        turno.setObservaciones(observaciones);

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