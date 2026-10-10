package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
        cerrarTurnosVencidos();
        if (existeTurnoAbiertoHoy()) {
            throw new RecursoDuplicadoException("¡Error! Ya existe una caja abierta en este momento.");
        }

        if (turno.getMontoInicial() == null || turno.getMontoInicial() < 0) {
            throw new SolicitudInvalidaException("El monto inicial de la caja debe ser mayor o igual a 0.");
        }
        turno.setFechaApertura(LocalDateTime.now());
        turno.setEstado(EstadoTurno.ABIERTO);

        turno.setMontoEsperadoSistema(turno.getMontoInicial());
        turno.setDiferenciaArqueo(0.0);
        turno.setCierreAutomatico(false);

        return turnoRepository.save(turno);
    }

    @Override
    public Turno cerrarTurno(Integer idTurno, Double montoReal, String observaciones, Integer idUsuario) {
    Turno turno = turnoRepository.findById(idTurno)
            .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el turno con ID: " + idTurno));


    if (turno.getEstado() == EstadoTurno.CERRADO) {
        throw new SolicitudInvalidaException("El turno con ID " + idTurno + " ya está cerrado.");
    }


    if (montoReal == null || Double.isNaN(montoReal)) {
        throw new SolicitudInvalidaException("El monto real contado es obligatorio y debe ser un número válido.");
    }

    turno.setEstado(EstadoTurno.CERRADO);
    turno.setFechaCierre(LocalDateTime.now());
    turno.setMontoRealContado(montoReal);

    List<MovimientoCaja> movimientosTurno = MovimientoCajaRepository.findByTurno_IdTurno(idTurno);

    double totalIngresos = movimientosTurno.stream()
            .filter(m -> "INGRESO".equalsIgnoreCase(m.getTipoMovimiento()))
            .mapToDouble(m -> m.getMonto().doubleValue())
            .sum();

    double totalEgresos = movimientosTurno.stream()
            .filter(m -> "EGRESO".equalsIgnoreCase(m.getTipoMovimiento()))
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
        // Antes de responder si hay caja abierta, se cierra la que haya quedado de otro día.
        cerrarTurnosVencidos();
        return turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO);
    }

    /**
     * Cierre automático a medianoche: una caja abierta un día anterior se cierra con fecha
     * 00:00 del día siguiente a su apertura. Antes quedaba abierta para siempre si nadie hacía
     * el cierre, y los movimientos de varios días se mezclaban en el mismo turno.
     *
     * Como nadie contó el efectivo, el "monto real" se toma igual al esperado (diferencia 0) y
     * queda marcada como cierre automático para que se vea en el historial de cajas.
     */
    @Override
    @org.springframework.transaction.annotation.Transactional
    public int cerrarTurnosVencidos() {
        LocalDateTime inicioDeHoy = java.time.LocalDate.now().atStartOfDay();
        List<Turno> vencidos = turnoRepository.findByEstadoAndFechaAperturaBefore(EstadoTurno.ABIERTO, inicioDeHoy);
        for (Turno turno : vencidos) {
            double esperado = calcularEsperado(turno);
            turno.setEstado(EstadoTurno.CERRADO);
            turno.setFechaCierre(turno.getFechaApertura().toLocalDate().plusDays(1).atStartOfDay());
            turno.setMontoEsperadoSistema(esperado);
            turno.setMontoRealContado(esperado);
            turno.setDiferenciaArqueo(0.0);
            turno.setCierreAutomatico(true);
            String previas = turno.getObservaciones() != null && !turno.getObservaciones().isBlank()
                    ? turno.getObservaciones() + " | " : "";
            turno.setObservaciones(previas + "Cierre automático a medianoche: la caja quedó abierta y no se hizo el "
                    + "cierre de turno, por lo que no se contó el efectivo (se registra el monto esperado por el sistema).");
            turnoRepository.save(turno);
        }
        return vencidos.size();
    }

    private double calcularEsperado(Turno turno) {
        List<MovimientoCaja> movimientos = MovimientoCajaRepository.findByTurno_IdTurno(turno.getIdTurno());
        double ingresos = movimientos.stream().filter(m -> "INGRESO".equalsIgnoreCase(m.getTipoMovimiento()))
                .mapToDouble(m -> m.getMonto().doubleValue()).sum();
        double egresos = movimientos.stream().filter(m -> "EGRESO".equalsIgnoreCase(m.getTipoMovimiento()))
                .mapToDouble(m -> m.getMonto().doubleValue()).sum();
        double inicial = turno.getMontoInicial() != null ? turno.getMontoInicial() : 0.0;
        return inicial + ingresos - egresos;
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
