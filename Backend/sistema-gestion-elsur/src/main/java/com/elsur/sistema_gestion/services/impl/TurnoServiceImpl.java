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
        if (existeTurnoAbiertoHoy()) {
            throw new RecursoDuplicadoException("¡Error! Ya existe una caja abierta en este momento.");
        }
        // FIX: antes se aceptaba cualquier monto inicial, incluso negativo, sin ninguna
        // validación en el backend (solo el frontend lo bloqueaba). Un turno no puede
        // arrancar con un fondo de caja negativo.
        if (turno.getMontoInicial() == null || turno.getMontoInicial() < 0) {
            throw new SolicitudInvalidaException("El monto inicial de la caja debe ser mayor o igual a 0.");
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
            .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el turno con ID: " + idTurno));

    // FIX: antes no se validaba el estado del turno -- un turno ya CERRADO se podía
    // volver a "cerrar", sobrescribiendo el arqueo original sin ningún aviso.
    if (turno.getEstado() == EstadoTurno.CERRADO) {
        throw new SolicitudInvalidaException("El turno con ID " + idTurno + " ya está cerrado.");
    }

    // FIX: antes un montoReal null o NaN (por ejemplo, si el frontend arma la URL con
    // Number('abc') = NaN) se propagaba tal cual a diferenciaArqueo, guardando un
    // registro contable corrupto.
    if (montoReal == null || Double.isNaN(montoReal)) {
        throw new SolicitudInvalidaException("El monto real contado es obligatorio y debe ser un número válido.");
    }

    turno.setEstado(EstadoTurno.CERRADO);
    turno.setFechaCierre(LocalDateTime.now());
    turno.setMontoRealContado(montoReal);

    List<MovimientoCaja> movimientosTurno = MovimientoCajaRepository.findByTurno_IdTurno(idTurno);

    // FIX: antes se comparaba tipoMovimiento con .equals() (exacto), mientras que
    // MovimientoCajaServiceImpl.calcularTotales() (que alimenta los totales EN VIVO de
    // CajaView) usa equalsIgnoreCase -- un movimiento guardado en minúscula contaba para
    // los totales del día pero no para el cálculo de cierre, generando una diferencia de
    // arqueo fantasma. Ahora ambos usan el mismo criterio (case-insensitive).
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
