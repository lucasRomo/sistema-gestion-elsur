package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.IncidenciaService;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Base64;

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
        // CORREGIDO: usaba RuntimeException genérica -- GlobalExceptionHandler la
        // traduce a 400 en vez de 404, inconsistente con el resto del sistema
        // (Cliente/Proveedor/Maquina ya usan RecursoNoEncontradoException para esto).
        Maquina maquina = maquinaRepository.findById(idMaquina)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la máquina con id: " + idMaquina));

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
        // CORREGIDO: se agregó la validación de la nota (el frontend ya la exigía,
        // pero una llamada directa a la API la saltaba por completo) y se reemplazó
        // la RuntimeException genérica por RecursoNoEncontradoException (404), mismo
        // criterio que el resto del sistema.
        if (notaMantenimiento == null || notaMantenimiento.trim().isEmpty()) {
            throw new SolicitudInvalidaException("Debe indicar la nota de mantenimiento.");
        }

        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la incidencia con id: " + idIncidencia));

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
        if (resolucion == null || resolucion.trim().isEmpty()) {
            throw new SolicitudInvalidaException("Debe indicar el detalle de la resolución.");
        }

        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la incidencia con id: " + idIncidencia));

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
    public MovimientoCaja registrarPagoMantenimiento(
            Integer idIncidencia, 
            BigDecimal monto, 
            String metodoPago, 
            String descripcion, 
            Integer idUsuario, 
            boolean forzarSaldoInsuficiente, 
            MultipartFile comprobante) {

        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la incidencia con id: " + idIncidencia));

        // CORREGIDO -- HALLAZGO: no existía NINGUNA validación de monto ni de
        // idUsuario en este método. Un monto nulo/negativo/cero, o un idUsuario
        // ausente, llegaban hasta usuarioRepository.findById(null), que Spring Data
        // rechaza con un IllegalArgumentException interno de bajo nivel ("The given
        // id must not be null!") -- un mensaje técnico feo en vez de un 400 claro.
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SolicitudInvalidaException("El monto del pago debe ser mayor a 0.");
        }
        if (idUsuario == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que registra el pago.");
        }

        // 1. Validar turno abierto en caja
        Turno turnoActivo = turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO)
                .orElseThrow(() -> new IllegalStateException("CAJA_CERRADA: La caja debe estar abierta para poder registrar pagos de mantenimiento."));
        
        // 2. Validar saldo disponible en caso de pago con EFECTIVO
        if ("EFECTIVO".equalsIgnoreCase(metodoPago) && !forzarSaldoInsuficiente) {
            Map<String, Double> totales = movimientoCajaService.calcularTotalesDelDia();
            Double saldoActual = totales.getOrDefault("saldoActual", 0.0);

            if (monto.doubleValue() > saldoActual) {
                throw new IllegalArgumentException("SALDO_INSUFFICIENT: Saldo actual en caja ($" + saldoActual + ") es menor al monto solicitado ($" + monto + ").");
            }
        }

        // CORREGIDO: "El usuario indicado no existe" es un dato de entrada inválido,
        // no un recurso principal ausente -- se usa SolicitudInvalidaException (400),
        // mismo criterio que el patrón "obtenerUsuarioOperador" ya cerrado en
        // Cliente/Proveedor/Maquina.
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));

        // Actualizar marca de pago en la incidencia
        incidencia.setPagado(true);
        incidencia.setMontoPagado(monto);
        incidenciaRepository.save(incidencia);

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

        // Convertir el archivo a Base64 con el prefijo Data URL
        if (comprobante != null && !comprobante.isEmpty()) {
            try {
                String contentType = comprobante.getContentType() != null 
                        ? comprobante.getContentType() 
                        : "image/jpeg";
                
                String base64Content = Base64.getEncoder().encodeToString(comprobante.getBytes());
                String dataUrl = "data:" + contentType + ";base64," + base64Content;
                
                movimiento.setComprobanteImagen(dataUrl);
            } catch (Exception e) {
                throw new RuntimeException("Error al procesar el archivo de comprobante", e);
            }
        }

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