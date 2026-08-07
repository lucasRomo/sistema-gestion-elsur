package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.IncidenciaService;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class IncidenciaServiceImpl implements IncidenciaService {

    @Autowired
    private IncidenciaRepository incidenciaRepository;

    @Autowired
    private MaquinaRepository maquinaRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @Override
    @Transactional
    public Incidencia registrarFalla(Integer idMaquina, String descripcion, String prioridad, Integer idEmpleadoReporta) {
        Maquina maquina = maquinaRepository.findById(idMaquina)
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada"));

        maquina.setEstado("FUERA DE SERVICIO");
        maquinaRepository.save(maquina);

        Incidencia incidencia = new Incidencia();
        incidencia.setMaquina(maquina);
        incidencia.setDescripcion(descripcion);
        incidencia.setPrioridad(prioridad != null ? prioridad : "MEDIA");
        incidencia.setEstadoIncidencia("PENDIENTE");
        incidencia.setFechaReporte(LocalDateTime.now());

        if (idEmpleadoReporta != null) {
            Empleado emp = empleadoRepository.findById(idEmpleadoReporta).orElse(null);
            incidencia.setEmpleadoReporta(emp);
        }

        return incidenciaRepository.save(incidencia);
    }

    @Override
    @Transactional
    public Incidencia ponerEnMantenimiento(Integer idIncidencia, String notaMantenimiento, Integer idEmpleadoMantenimiento) {
        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada"));

        incidencia.setNotaMantenimiento(notaMantenimiento);
        incidencia.setFechaMantenimiento(LocalDateTime.now());
        incidencia.setEstadoIncidencia("MANTENIMIENTO");

        if (idEmpleadoMantenimiento != null) {
            Empleado emp = empleadoRepository.findById(idEmpleadoMantenimiento).orElse(null);
            incidencia.setEmpleadoMantenimiento(emp);
        }

        Maquina maquina = incidencia.getMaquina();
        maquina.setEstado("MANTENIMIENTO");
        maquinaRepository.save(maquina);

        return incidenciaRepository.save(incidencia);
    }

    @Override
    @Transactional
    public Incidencia resolverIncidencia(Integer idIncidencia, String resolucion, Integer idEmpleadoResuelve) {
        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada"));

        incidencia.setResolucion(resolucion);
        incidencia.setFechaResolucion(LocalDateTime.now());
        incidencia.setEstadoIncidencia("RESUELTA");

        if (idEmpleadoResuelve != null) {
            Empleado emp = empleadoRepository.findById(idEmpleadoResuelve).orElse(null);
            incidencia.setEmpleadoResuelve(emp);
        }

        Maquina maquina = incidencia.getMaquina();
        List<Incidencia> pendientes = incidenciaRepository
                .findByMaquinaIdMaquinaAndEstadoIncidencia(maquina.getIdMaquina(), "PENDIENTE");
        
        if (pendientes.size() <= 1) { 
            maquina.setEstado("OPERATIVA");
            maquinaRepository.save(maquina);
        }

        return incidenciaRepository.save(incidencia);
    }

    @Override
    @Transactional
    public MovimientoCaja registrarPagoMantenimiento(Integer idIncidencia, BigDecimal monto, String metodoPago, String descripcion, Integer idUsuario, boolean forzarSaldoInsuficiente) {
        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada"));

        // 1. Validar turno abierto en caja
        Turno turnoActivo = turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO)
        .orElseThrow(() -> new IllegalStateException("CAJA_CERRADA: La caja debe estar abierta para poder registrar pagos de mantenimiento."));
        
        // 2. Validar saldo disponible en caso de pago con EFECTIVO
        if ("EFECTIVO".equalsIgnoreCase(metodoPago) && !forzarSaldoInsuficiente) {
            Map<String, Double> totales = movimientoCajaService.calcularTotalesDelDia();
            Double saldoActual = totales.getOrDefault("saldoActual", 0.0);

            if (monto.doubleValue() > saldoActual) {
                throw new IllegalArgumentException("SALDO_INSUFICIENTE: Saldo actual en caja ($" + saldoActual + ") es menor al monto solicitado ($" + monto + ").");
            }
        }

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        MovimientoCaja movimiento = new MovimientoCaja();
        movimiento.setMonto(monto);
        movimiento.setTipoMovimiento("EGRESO");
        movimiento.setCategoria("EGRESO_MANTENIMIENTO");
        movimiento.setMetodoPago(metodoPago != null ? metodoPago : "EFECTIVO");
        movimiento.setDescripcion(descripcion != null && !descripcion.isBlank() 
            ? descripcion 
            : "Pago mantenimiento " + incidencia.getMaquina().getNombre() + " (Incidencia #" + idIncidencia + ")");
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setUsuario(usuario);
        movimiento.setTurno(turnoActivo);
        movimiento.setIncidencia(incidencia);

        return movimientoCajaRepository.save(movimiento);
    }

    @Override
    public List<Incidencia> obtenerPorMaquina(Integer idMaquina) {
        return incidenciaRepository.findByMaquinaIdMaquinaOrderByFechaReporteDesc(idMaquina);
    }

    @Override
    public List<Incidencia> listarTodas() {
        return incidenciaRepository.findAll();
    }
}