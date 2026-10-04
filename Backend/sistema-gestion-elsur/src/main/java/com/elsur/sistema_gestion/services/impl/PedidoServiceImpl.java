package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.PedidoService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class PedidoServiceImpl implements PedidoService {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private ProductoInsumoRepository productoInsumoRepository;
    @Autowired private MovimientoCajaRepository cajaRepository;
    @Autowired private HistorialEstadoPedidoRepository historialRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private SupabaseStorageService supabaseStorageService;

    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private AsignacionPedidoRepository asignacionRepository;

    @Autowired private TurnoRepository TurnoRepository;

    @Autowired private DetallePedidoRepository detallePedidoRepository;

    @Autowired private UsuarioRepository usuarioRepository;

    @Autowired private ComprobantePagoRepository comprobantePagoRepository;

    @Autowired private ProductoRepository productoRepository;

    @Autowired private MovimientoCuentaCorrienteRepository movimientoCCRepository;

    @Autowired private categoriaClienteRepository categoriaClienteRepository;

    // Estados que ya salieron de la cola del taller. Filtrar en la base evita traer (y
    // serializar con todas sus relaciones) cada pedido histórico en cada recarga.
    private static final List<String> ESTADOS_FUERA_DE_COLA = List.of("VENTA_RAPIDA", "ENTREGADO", "CANCELADO", "DEVUELTO");
    private static final List<String> ESTADOS_HISTORIAL = List.of("ENTREGADO", "CANCELADO", "FINALIZADO", "DEVUELTO");

    @Override
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    @Override
    public List<Pedido> listarActivos() {
        return pedidoRepository.findByEstadoNotIn(ESTADOS_FUERA_DE_COLA);
    }

    @Override
    public List<Pedido> listarCerrados() {
        return pedidoRepository.findByEstadoIn(ESTADOS_HISTORIAL);
    }

    @Override
    public Pedido buscarPorId(Integer id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));

        if (pedido.getHistoriales() != null) {
            pedido.getHistoriales().size();
        }

        if (pedido.getComprobantes() != null) {
            pedido.getComprobantes().size();
        }

        if (pedido.getMovimientos() != null) {
            pedido.getMovimientos().size();
        }

        return pedido;
    }

    @Override
    @Transactional
    public void actualizarUbicacion(Integer idPedido, String nuevaUbicacion) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado con ID: " + idPedido));

        if (nuevaUbicacion == null || nuevaUbicacion.isBlank()) {
            throw new SolicitudInvalidaException("Debe indicar la nueva ubicación del pedido.");
        }
        nuevaUbicacion = nuevaUbicacion.trim();
        if (nuevaUbicacion.length() > 20) {
            throw new SolicitudInvalidaException("La ubicación no puede superar los 20 caracteres.");
        }

        String ubicacionAnterior = pedido.getUbicacion_estante() != null ? pedido.getUbicacion_estante() : "Taller";

        if (ubicacionAnterior.equals(nuevaUbicacion)) {
            return;
        }

        pedido.setUbicacion_estante(nuevaUbicacion);
        pedidoRepository.save(pedido);

        HistorialEstadoPedido historial = new HistorialEstadoPedido();
        historial.setPedido(pedido);
        historial.setFecha_cambio(LocalDateTime.now());
        historial.setEstado_anterior("UBICACION: " + ubicacionAnterior);
        historial.setEstado_nuevo("UBICACION: " + nuevaUbicacion);
        historial.setObservaciones("Cambio de ubicación del pedido en el local");
        historial.setUsuarioResponsable(resolverUsuarioResponsable(null));

        historialRepository.save(historial);
    }

    @Override
    @Transactional
    public Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante,
                           boolean confirmarMaquinaNoDisponible) {
        return guardar(pedido, idEmpleado, idUsuario, tipoPago, comprobante, confirmarMaquinaNoDisponible, null, false);
    }

    @Override
    @Transactional
    public Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante,
                           boolean confirmarMaquinaNoDisponible, Integer idCategoriaCliente) {
        return guardar(pedido, idEmpleado, idUsuario, tipoPago, comprobante, confirmarMaquinaNoDisponible, idCategoriaCliente, true);
    }

    /**
     * El total que manda el navegador no es confiable (se puede alterar la petición). Se recalcula
     * con el precio base actual de cada producto y el descuento de la categoría de cliente. Si no
     * coincide con lo que se le mostró al usuario se rechaza en vez de corregirlo en silencio:
     * así nunca se cobra un monto distinto al que vio (ej. si alguien cambió un precio mientras
     * el pedido se estaba armando).
     */
    private void validarYRecalcularTotal(Pedido pedido, Integer idCategoriaCliente) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (DetallePedido detalle : pedido.getDetalles()) {
            BigDecimal precio = detalle.getProducto().getPrecioBase() != null
                    ? detalle.getProducto().getPrecioBase() : BigDecimal.ZERO;
            BigDecimal subtotalDetalle = precio.multiply(BigDecimal.valueOf(detalle.getCantidad()));
            detalle.setPrecioUnitario(precio);
            detalle.setSubtotal(subtotalDetalle);
            subtotal = subtotal.add(subtotalDetalle);
        }

        BigDecimal porcentaje = BigDecimal.ZERO;
        if (idCategoriaCliente != null) {
            porcentaje = categoriaClienteRepository.findById(idCategoriaCliente)
                    .map(c -> c.getDescuentoAutomatico() != null ? c.getDescuentoAutomatico() : BigDecimal.ZERO)
                    .orElseThrow(() -> new SolicitudInvalidaException("La categoría de cliente indicada no existe."));
        }

        BigDecimal totalEsperado = subtotal
                .subtract(subtotal.multiply(porcentaje).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal totalRecibido = pedido.getMonto_total() != null ? pedido.getMonto_total() : BigDecimal.ZERO;
        if (totalEsperado.subtract(totalRecibido).abs().compareTo(new BigDecimal("0.05")) > 0) {
            throw new SolicitudInvalidaException(
                "El total del pedido ($" + totalRecibido.setScale(2, java.math.RoundingMode.HALF_UP) +
                ") no coincide con los precios actuales ($" + totalEsperado +
                "). Es posible que algún precio se haya modificado: volvé a cargar la pantalla e intentá de nuevo.");
        }
        pedido.setMonto_total(totalEsperado);

        BigDecimal adelanto = pedido.getMonto_pago_adelantado() != null ? pedido.getMonto_pago_adelantado() : BigDecimal.ZERO;
        if (adelanto.compareTo(totalEsperado.add(new BigDecimal("0.05"))) > 0) {
            throw new SolicitudInvalidaException(
                "La seña/adelanto ($" + adelanto + ") no puede superar el total del pedido ($" + totalEsperado + ").");
        }
        if (adelanto.compareTo(totalEsperado) > 0) {
            // Diferencia de redondeo (ej. venta rápida paga 333.333 y el total queda en 333.33).
            pedido.setMonto_pago_adelantado(totalEsperado);
        }
    }

    private Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante,
                           boolean confirmarMaquinaNoDisponible, Integer idCategoriaCliente, boolean recalcularTotal) {
        boolean existeCajaAbierta = TurnoRepository.existsByEstado(EstadoTurno.ABIERTO);
        if (!existeCajaAbierta) {
            throw new SolicitudInvalidaException("La Caja No está Abierta. Por favor, inicie turno antes de continuar.");
        }
        LocalDateTime ahora = LocalDateTime.now();
        if (pedido.getFecha_creacion() == null) {
        pedido.setFecha_creacion(ahora);
        }
        if (pedido.getFecha_entrega_estimada() == null) {
        pedido.setFecha_entrega_estimada(ahora);
        }

        Integer idCliente = (pedido.getCliente() != null && pedido.getCliente().getIdCliente() != null)
                            ? pedido.getCliente().getIdCliente() : 1;
        Cliente clienteActual = clienteRepository.findById(idCliente)
            .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado"));
        pedido.setCliente(clienteActual);

        if (pedido.getDetalles() == null || pedido.getDetalles().isEmpty()) {
            throw new SolicitudInvalidaException("El pedido debe tener al menos un producto.");
        }
        if (pedido.getMonto_total() == null || pedido.getMonto_total().compareTo(BigDecimal.ZERO) < 0) {
            throw new SolicitudInvalidaException("El monto total del pedido no es válido.");
        }

        if (pedido.getDetalles() != null) {
            for (DetallePedido detalle : pedido.getDetalles()) {
                if (detalle.getCantidad() == null || detalle.getCantidad() <= 0) {
                    throw new SolicitudInvalidaException("La cantidad de cada producto del pedido debe ser mayor a 0.");
                }
                detalle.setPedido(pedido);
                if (detalle.getProducto() != null && detalle.getProducto().getIdProducto() != null) {
                    Producto prod = productoRepository.findById(detalle.getProducto().getIdProducto())
                        .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado"));
                    detalle.setProducto(prod);
                } else {
                    throw new SolicitudInvalidaException(
                        "Cada detalle del pedido debe indicar un producto válido (falta el producto o su id).");
                }
            }
        }

        if (recalcularTotal) {
            validarYRecalcularTotal(pedido, idCategoriaCliente);
        }

        if ("PRESUPUESTO".equalsIgnoreCase(pedido.getEstado())) {
            pedido.setEs_presupuesto(true);
        }

        boolean esCuentaCorriente = (tipoPago != null && (tipoPago.equalsIgnoreCase("Cuenta Corriente") || tipoPago.equalsIgnoreCase("CUENTA_CORRIENTE")))
                                    || (pedido.isEs_cuenta_corriente());

        if (idCliente == 1 && esCuentaCorriente) {
            throw new SolicitudInvalidaException("El Consumidor Final no puede realizar compras a Cuenta Corriente.");
        }

        if (esCuentaCorriente) {
            pedido.setEs_cuenta_corriente(true);
        }

        Pedido p = pedidoRepository.save(pedido);
        pedidoRepository.flush();

        if (idEmpleado != null) {
            Empleado emp = empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new RecursoNoEncontradoException("Empleado no encontrado"));
            AsignacionPedido asignacion = new AsignacionPedido();
            asignacion.setPedido(p);
            asignacion.setEmpleado(emp);
            asignacion.setFecha_asignacion(LocalDateTime.now());
            asignacionRepository.save(asignacion);
        }

        BigDecimal seña = p.getMonto_pago_adelantado();

        if (seña != null && seña.compareTo(BigDecimal.ZERO) < 0) {
            throw new SolicitudInvalidaException("El monto de seña/adelanto no puede ser negativo.");
        }

        if (seña != null && seña.compareTo(BigDecimal.ZERO) > 0) {

            if (p.getComprobantes() == null) {
                p.setComprobantes(new ArrayList<>());
            }

            ComprobantePago nuevoCobro = new ComprobantePago();
            nuevoCobro.setPedido(p);

            String urlDeImagen = null;
            String tipoDePagoFinal = "EFECTIVO";

            if (tipoPago != null) {
                if (tipoPago.equalsIgnoreCase("Tarjeta / Transferencia") || tipoPago.equalsIgnoreCase("TRANSFERENCIA")) {
                    tipoDePagoFinal = "TRANSFERENCIA";
                } else if (tipoPago.equalsIgnoreCase("Cuenta Corriente") || tipoPago.equalsIgnoreCase("CUENTA_CORRIENTE")) {
                    tipoDePagoFinal = "CUENTA_CORRIENTE";
                }
            }

            if (comprobante != null && !comprobante.isEmpty()) {
                urlDeImagen = guardarArchivoFisico(comprobante);
                tipoDePagoFinal = "TRANSFERENCIA";
            }

            nuevoCobro.setTipoPago(tipoDePagoFinal);
            nuevoCobro.setMontoPago(seña);
            nuevoCobro.setFechaCarga(LocalDateTime.now());
            nuevoCobro.setUrlArchivoComprobante(urlDeImagen);

            p.getComprobantes().add(nuevoCobro);

            try {
                MovimientoCaja movimiento = new MovimientoCaja();
                movimiento.setTipoMovimiento("INGRESO");
                movimiento.setCategoria("VENTA");
                movimiento.setMonto(seña);
                movimiento.setMetodoPago(tipoDePagoFinal);
                movimiento.setFecha(LocalDateTime.now());
                movimiento.setPedido(p);
                movimiento.setDescripcion("Seña/Adelanto inicial - Pedido #" + p.getId_pedido());
                boolean esVentaRapida = p.getObservaciones() != null && p.getObservaciones().contains("Venta Rápida");
                if (esVentaRapida) {
                    movimiento.setDescripcion("Venta Rápida");
                } else {
                    movimiento.setDescripcion("Seña/Adelanto inicial - Pedido #" + p.getId_pedido());
                }
                movimiento.setComprobanteImagen(urlDeImagen);

                Turno turnoActivo = TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO).orElse(null);
                movimiento.setTurno(turnoActivo);

                Usuario usuarioResponsable = null;
                if (idUsuario != null) {
                    usuarioResponsable = usuarioRepository.findById(idUsuario).orElse(null);
                }
                if (usuarioResponsable == null) {
                    usuarioResponsable = usuarioRepository.findAll().stream()
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("No existe usuario para asignar a la caja."));
                }
                movimiento.setUsuario(usuarioResponsable);

                MovimientoCaja movGuardado = cajaRepository.save(movimiento);

                if (p.getMovimientos() == null) {
                    p.setMovimientos(new ArrayList<>());
                }
                p.getMovimientos().add(movGuardado);

            } catch (Exception e) {
                System.err.println("Error al registrar movimiento de ticket en caja: " + e.getMessage());
                e.printStackTrace();
            }
        }

        boolean nacioEnEstadoFinal = "ENTREGADO".equalsIgnoreCase(p.getEstado())
                || "FINALIZADO".equalsIgnoreCase(p.getEstado());

        if ((p.isEs_cuenta_corriente() || nacioEnEstadoFinal) && idCliente != 1) {
            BigDecimal total = p.getMonto_total() != null ? p.getMonto_total() : BigDecimal.ZERO;
            BigDecimal adelanto = seña != null ? seña : BigDecimal.ZERO;
            BigDecimal saldoPendienteGenerado = total.subtract(adelanto);

            if (saldoPendienteGenerado.compareTo(BigDecimal.ZERO) > 0) {
                boolean eraCuentaCorrienteExplicita = p.isEs_cuenta_corriente();

                p.setEs_cuenta_corriente(true);

                BigDecimal saldoActual = clienteActual.getSaldoDeudor() != null ? clienteActual.getSaldoDeudor() : BigDecimal.ZERO;
                clienteActual.setSaldoDeudor(saldoActual.add(saldoPendienteGenerado));
                clienteRepository.save(clienteActual);

                try {
                    MovimientoCuentaCorriente movCC = new MovimientoCuentaCorriente();
                    movCC.setCliente(clienteActual);
                    movCC.setTipo("COMPRA");
                    movCC.setMonto(saldoPendienteGenerado);
                    movCC.setDescripcion(eraCuentaCorrienteExplicita
                            ? "Compra a Cuenta Corriente - Pedido #" + p.getId_pedido()
                            : "Entrega con saldo pendiente - Pedido #" + p.getId_pedido());
                    movCC.setFecha(LocalDateTime.now());
                    movimientoCCRepository.save(movCC);
                } catch (Exception e) {
                    System.err.println("Error al registrar historial de Cuenta Corriente: " + e.getMessage());
                }
            }
        }

        boolean esVentaRapidaAlAlta = p.getObservaciones() != null && p.getObservaciones().contains("Venta Rápida");

        boolean creadoDirectoEnEstadoFinal = "ENTREGADO".equalsIgnoreCase(p.getEstado())
                || "FINALIZADO".equalsIgnoreCase(p.getEstado());

        if (esVentaRapidaAlAlta || creadoDirectoEnEstadoFinal) {
            this.procesarDescuentoStock(p.getId_pedido(), confirmarMaquinaNoDisponible);
            p = pedidoRepository.findById(p.getId_pedido()).orElse(p);
        }

        return pedidoRepository.save(p);
    }

    @Override
    @Transactional
    public void asignarEmpleado(Integer idPedido, Integer idEmpleado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));

        Empleado empleadoNuevo = empleadoRepository.findById(idEmpleado)
            .orElseThrow(() -> new RecursoNoEncontradoException("Empleado no encontrado"));

        String nombreEmpleadoAnterior = "Sin Asignar";
        if (pedido.getAsignaciones() != null && !pedido.getAsignaciones().isEmpty()) {
            AsignacionPedido ultima = pedido.getAsignaciones().get(pedido.getAsignaciones().size() - 1);
            if (ultima.getEmpleado() != null && idEmpleado.equals(ultima.getEmpleado().getIdEmpleado())) {
                return;
            }
            if (ultima.getEmpleado() != null && ultima.getEmpleado().getPersona() != null) {
                nombreEmpleadoAnterior = ultima.getEmpleado().getPersona().getNombre() + " " +
                                         ultima.getEmpleado().getPersona().getApellido();
            }
        }

        String nombreEmpleadoNuevo = (empleadoNuevo.getPersona() != null)
            ? empleadoNuevo.getPersona().getNombre() + " " + empleadoNuevo.getPersona().getApellido()
            : "Empleado #" + idEmpleado;

        AsignacionPedido nuevaAsignacion = new AsignacionPedido();
        nuevaAsignacion.setPedido(pedido);
        nuevaAsignacion.setEmpleado(empleadoNuevo);
        nuevaAsignacion.setFecha_asignacion(LocalDateTime.now());

        if (pedido.getAsignaciones() == null) {
            pedido.setAsignaciones(new ArrayList<>());
        }
        pedido.getAsignaciones().add(nuevaAsignacion);

        HistorialEstadoPedido historial = new HistorialEstadoPedido();
        historial.setPedido(pedido);
        historial.setFecha_cambio(LocalDateTime.now());
        historial.setEstado_anterior("ASIGNADO: " + nombreEmpleadoAnterior);
        historial.setEstado_nuevo("ASIGNADO: " + nombreEmpleadoNuevo);
        historial.setObservaciones("Reasignación de operario de taller");
        historial.setUsuarioResponsable(resolverUsuarioResponsable(null));

        historialRepository.save(historial);
        pedidoRepository.save(pedido);
    }

    @Override
    @Transactional
    public Pedido eliminarArchivoDeComprobante(Integer idComprobante) {
        ComprobantePago comprobante = comprobantePagoRepository.findById(idComprobante)
            .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante no encontrado"));

        String urlArchivo = comprobante.getUrlArchivoComprobante();

        MovimientoCaja movimientoAsociado = buscarMovimientoAsociado(comprobante, urlArchivo);

        if (urlArchivo != null && !urlArchivo.isEmpty()) {
        supabaseStorageService.eliminarArchivo("comprobantes", urlArchivo);
        }

        comprobante.setUrlArchivoComprobante(null);
        comprobantePagoRepository.saveAndFlush(comprobante);


        if (movimientoAsociado != null) {
            movimientoAsociado.setComprobanteImagen(null);
            cajaRepository.save(movimientoAsociado);
        }

        return comprobante.getPedido();
    }

    private MovimientoCaja buscarMovimientoAsociado(ComprobantePago comprobante, String urlEsperada) {
        if (comprobante.getPedido() == null || comprobante.getPedido().getId_pedido() == null) {
            return null;
        }

        List<MovimientoCaja> movimientos = cajaRepository.buscarPorPedido(comprobante.getPedido().getId_pedido());

        return movimientos.stream()
            .filter(m -> m.getMonto() != null && comprobante.getMontoPago() != null
                && m.getMonto().compareTo(comprobante.getMontoPago()) == 0)
            .filter(m -> Objects.equals(m.getMetodoPago(), comprobante.getTipoPago()))
            .filter(m -> Objects.equals(m.getComprobanteImagen(), urlEsperada))
            .findFirst()
            .orElse(null);
    }

    @Override
    @Transactional
    public void procesarDescuentoStock(Integer idPedido) {

        procesarDescuentoStock(idPedido, false);
    }

    @Override
    @Transactional
    public void procesarDescuentoStock(Integer idPedido, boolean confirmarMaquinaNoDisponible) {
    Pedido pedido = pedidoRepository.findById(idPedido)
        .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado"));

    if (pedido.isStockDescontado()) {
        return;
    }

    if (pedido.getDetalles().isEmpty()) {
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(idPedido);
        pedido.setDetalles(detalles);
    }

    if (pedido.getDetalles().isEmpty()) {
        throw new SolicitudInvalidaException("El pedido no tiene detalles registrados");
    }

    for (DetallePedido detalle : pedido.getDetalles()) {
        Producto producto = detalle.getProducto();
        if (producto == null) {
            throw new SolicitudInvalidaException(
                "El pedido tiene un detalle sin producto válido; no se puede procesar el stock.");
        }


        Maquina maquinaNecesaria = producto.getMaquinaNecesaria();
        if (maquinaNecesaria != null) {
            String nombreMaquina = maquinaNecesaria.getNombre() != null ? maquinaNecesaria.getNombre().trim() : "";
            boolean noAplica = nombreMaquina.isEmpty() || nombreMaquina.toLowerCase().contains("no aplica");

            if (!noAplica) {
                String estadoMaquina = maquinaNecesaria.getEstado() != null
                        ? maquinaNecesaria.getEstado().trim().toUpperCase().replace('_', ' ')
                        : "";
                boolean maquinaNoDisponible = estadoMaquina.contains("FUERA DE SERVICIO")
                        || estadoMaquina.contains("FALLA")
                        || estadoMaquina.contains("MANTENIMIENTO");

                if (maquinaNoDisponible && !confirmarMaquinaNoDisponible) {
                    throw new ConflictoDeIntegridadException(
                        "No se puede completar el pedido: la máquina '" + nombreMaquina +
                        "' que requiere \"" + producto.getNombreProducto() + "\" está " +
                        maquinaNecesaria.getEstado() + ".");
                }
            }
        }

        if (Boolean.TRUE.equals(producto.getStockVinculado())) {
            List<ProductoInsumo> receta = productoInsumoRepository.findByIdIdProducto(producto.getIdProducto());

            for (ProductoInsumo pi : receta) {
                Insumo insumo = pi.getInsumo();
                BigDecimal consumoTotal = pi.getCantidadConsumo()
                        .multiply(BigDecimal.valueOf(detalle.getCantidad()));

                if (insumo.getStockActual().compareTo(consumoTotal) < 0) {
                    throw new SolicitudInvalidaException("Stock insuficiente del insumo '" + insumo.getNombreInsumo() +
                            "' para producir el producto " + producto.getNombreProducto());
                }

                insumo.setStockActual(insumo.getStockActual().subtract(consumoTotal));
                insumoRepository.save(insumo);
            }
        }
        else {
            if (producto.getStock() != null) {
                int nuevoStock = producto.getStock() - detalle.getCantidad();
                if (nuevoStock < 0) {
                    throw new SolicitudInvalidaException("Stock insuficiente para el producto: " + producto.getNombreProducto());
                }
                producto.setStock(nuevoStock);
                productoRepository.save(producto);
            }
        }
    }

    if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
        pedido.setEstado("VENTA_RAPIDA");
    } else {
        pedido.setEstado("ENTREGADO");
    }
    pedido.setFecha_finalizacion(LocalDateTime.now());
    pedido.setStockDescontado(true);
    pedidoRepository.save(pedido);
    }

    @Override
    @Transactional
    public void actualizarEstado(Integer idPedido, String nuevoEstado) {
        Pedido pedido = buscarPorId(idPedido);
        String estadoAnterior = pedido.getEstado();

        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);

        registrarHistorial(pedido, estadoAnterior, nuevoEstado);
    }

    private void registrarHistorial(Pedido pedido, String anterior, String nuevo) {
        HistorialEstadoPedido historial = new HistorialEstadoPedido();
        historial.setPedido(pedido);
        historial.setEstado_anterior(anterior);
        historial.setEstado_nuevo(nuevo);
        historial.setFecha_cambio(LocalDateTime.now());

        historial.setUsuarioResponsable(resolverUsuarioResponsable(null));
        historialRepository.save(historial);
    }

    /**
     * Usuario a registrar en el historial: primero el autenticado por JWT (no se puede
     * falsificar desde el cliente), después el idUsuario enviado y, solo si no hay
     * ninguno (ej. procesos internos/tests), el primer usuario de la base.
     */
    private Usuario resolverUsuarioResponsable(Integer idUsuario) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null
                && !"anonymousUser".equals(auth.getName())) {
            java.util.Optional<Usuario> autenticado = usuarioRepository.findByNombreUsuario(auth.getName());
            if (autenticado.isPresent()) {
                return autenticado.get();
            }
        }
        if (idUsuario != null) {
            java.util.Optional<Usuario> indicado = usuarioRepository.findById(idUsuario);
            if (indicado.isPresent()) {
                return indicado.get();
            }
        }
        return usuarioRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No hay usuarios cargados en el sistema"));
    }

    @Override
    @Transactional
    public Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario,
                                       boolean confirmarMaquinaNoDisponible) {
        if (nuevoEstado == null || nuevoEstado.isBlank()) {
            throw new SolicitudInvalidaException("Debe indicar el nuevo estado del pedido.");
        }

        Pedido pedido = buscarPorId(idPedido);
        String estadoAnterior = pedido.getEstado();

        if ("CANCELADO".equalsIgnoreCase(estadoAnterior)) {
            throw new SolicitudInvalidaException(
                "Este pedido fue cancelado y no puede ser modificado ni devuelto. Por favor, registre uno nuevo en Crear Pedido.");
        }
        if ("DEVUELTO".equalsIgnoreCase(estadoAnterior)) {
            throw new SolicitudInvalidaException("Este pedido ya fue devuelto y no puede volver a modificarse.");
        }
        if (nuevoEstado.equalsIgnoreCase(estadoAnterior)) {
            throw new SolicitudInvalidaException("El pedido ya se encuentra en estado " + estadoAnterior + ".");
        }

        boolean esEstadoFinal ="FINALIZADO".equalsIgnoreCase(nuevoEstado) || "ENTREGADO".equalsIgnoreCase(nuevoEstado);
        boolean yaEstabaFinalizado = "FINALIZADO".equalsIgnoreCase(estadoAnterior) || "ENTREGADO".equalsIgnoreCase(estadoAnterior) || "VENTA_RAPIDA".equalsIgnoreCase(estadoAnterior);

        if (esEstadoFinal && !yaEstabaFinalizado) {
            Cliente clienteAntesDeEntregar = pedido.getCliente();
            if (clienteAntesDeEntregar != null && clienteAntesDeEntregar.getIdCliente() == 1) {
                BigDecimal totalAntesDeEntregar = pedido.getMonto_total() != null ? pedido.getMonto_total() : BigDecimal.ZERO;
                BigDecimal pagadoAntesDeEntregar = pedido.getMonto_pago_adelantado() != null ? pedido.getMonto_pago_adelantado() : BigDecimal.ZERO;
                BigDecimal saldoPendienteAntesDeEntregar = totalAntesDeEntregar.subtract(pagadoAntesDeEntregar);

                if (saldoPendienteAntesDeEntregar.compareTo(BigDecimal.ZERO) > 0) {
                    throw new SolicitudInvalidaException(
                        "No se puede entregar/finalizar este pedido: el Consumidor Final tiene un saldo pendiente de $"
                            + saldoPendienteAntesDeEntregar
                            + ". Cobre el total antes de continuar -- el Consumidor Final no opera con Cuenta Corriente.");
                }
            }

            this.procesarDescuentoStock(idPedido, confirmarMaquinaNoDisponible);
            pedido = buscarPorId(idPedido);

            pedido.setEstado(nuevoEstado);
            if ("FINALIZADO".equalsIgnoreCase(nuevoEstado)) {
                pedido.setFecha_finalizacion(LocalDateTime.now());
            }

            pedidoRepository.save(pedido);

            Cliente clienteDelPedido = pedido.getCliente();
            if (clienteDelPedido != null && clienteDelPedido.getIdCliente() != 1) {
                BigDecimal totalPedido = pedido.getMonto_total() != null ? pedido.getMonto_total() : BigDecimal.ZERO;
                BigDecimal pagadoPedido = pedido.getMonto_pago_adelantado() != null ? pedido.getMonto_pago_adelantado() : BigDecimal.ZERO;
                BigDecimal saldoPendienteEntrega = totalPedido.subtract(pagadoPedido);

                if (saldoPendienteEntrega.compareTo(BigDecimal.ZERO) > 0) {
                    pedido.setEs_cuenta_corriente(true);

                    BigDecimal saldoActualCliente = clienteDelPedido.getSaldoDeudor() != null
                            ? clienteDelPedido.getSaldoDeudor() : BigDecimal.ZERO;
                    clienteDelPedido.setSaldoDeudor(saldoActualCliente.add(saldoPendienteEntrega));
                    clienteRepository.save(clienteDelPedido);

                    try {
                        MovimientoCuentaCorriente movCC = new MovimientoCuentaCorriente();
                        movCC.setCliente(clienteDelPedido);
                        movCC.setTipo("COMPRA");
                        movCC.setMonto(saldoPendienteEntrega);
                        movCC.setDescripcion("Entrega con saldo pendiente - Pedido #" + pedido.getId_pedido());
                        movCC.setFecha(LocalDateTime.now());
                        movimientoCCRepository.save(movCC);
                    } catch (Exception e) {
                        System.err.println("Error al registrar historial de Cuenta Corriente en la entrega: " + e.getMessage());
                    }

                    pedido = pedidoRepository.save(pedido);
                }
            }
        } else {
            pedido.setEstado(nuevoEstado);
            if (esEstadoFinal) {
                pedido.setFecha_finalizacion(LocalDateTime.now());
            }
            pedidoRepository.save(pedido);
        }

        HistorialEstadoPedido historial = new HistorialEstadoPedido();
        historial.setPedido(pedido);
        historial.setEstado_anterior(estadoAnterior);
        historial.setEstado_nuevo(pedido.getEstado());
        historial.setFecha_cambio(LocalDateTime.now());
        historial.setObservaciones(observaciones);

        historial.setUsuarioResponsable(resolverUsuarioResponsable(idUsuario));
        historialRepository.save(historial);

        return pedido;
    }

    @Override
    @Transactional
    public Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante, Integer idUsuario) {
        if (monto == null || monto.isNaN() || monto <= 0) {
            throw new SolicitudInvalidaException("El monto del pago debe ser un número mayor a 0.");
        }

        if (idUsuario == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que registra el cobro.");
        }
        Usuario usuarioOperador = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));

        Turno turnoActivo = TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO).orElse(null);
        if (turnoActivo == null) {
            throw new SolicitudInvalidaException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el pedido"));

        BigDecimal montoBD = BigDecimal.valueOf(monto);
        BigDecimal saldoPendiente = pedido.getMonto_total().subtract(pedido.getMonto_pago_adelantado());
        if (montoBD.compareTo(saldoPendiente) > 0) {
            throw new SolicitudInvalidaException(
                "El monto ingresado ($" + montoBD + ") no puede superar el saldo pendiente del pedido ($" + saldoPendiente + ")."
            );
        }

        if ("CUENTA_CORRIENTE".equalsIgnoreCase(tipoPago) || "Cuenta Corriente".equalsIgnoreCase(tipoPago)) {
            if (pedido.getCliente() != null && pedido.getCliente().getIdCliente() == 1) {
                throw new SolicitudInvalidaException("El Consumidor Final no puede usar Cuenta Corriente.");
            }
            pedido.setEs_cuenta_corriente(true);
        }

        pedido.setMonto_pago_adelantado(pedido.getMonto_pago_adelantado().add(montoBD));

        if (pedido.isEs_cuenta_corriente() && pedido.getCliente() != null && pedido.getCliente().getIdCliente() != 1) {
            Cliente c = pedido.getCliente();
            BigDecimal saldoActual = c.getSaldoDeudor() != null ? c.getSaldoDeudor() : BigDecimal.ZERO;
            BigDecimal nuevoSaldo = saldoActual.subtract(montoBD);
            if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                nuevoSaldo = BigDecimal.ZERO;
            }
            c.setSaldoDeudor(nuevoSaldo);
            clienteRepository.save(c);

            try {
                MovimientoCuentaCorriente movCC = new MovimientoCuentaCorriente();
                movCC.setCliente(c);
                movCC.setTipo("PAGO");
                movCC.setMonto(montoBD);
                movCC.setDescripcion("Pago / Abono de Pedido #" + idPedido);
                movCC.setFecha(LocalDateTime.now());
                movimientoCCRepository.save(movCC);
            } catch (Exception e) {
                System.err.println("Error al registrar movimiento CC en cobro: " + e.getMessage());
            }
        }

        pedidoRepository.save(pedido);

        MovimientoCaja mov = new MovimientoCaja();
        mov.setTipoMovimiento("INGRESO");
        mov.setCategoria("VENTA");
        mov.setMonto(montoBD);
        mov.setMetodoPago(tipoPago);
        mov.setFecha(LocalDateTime.now());
        mov.setTurno(turnoActivo);

        String descripcion;
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
            descripcion = "Venta Rápida";
        } else {
            descripcion = "Cobro Pendiente de Pedido #" + idPedido;
        }
        mov.setDescripcion(descripcion);

        mov.setUsuario(usuarioOperador);

        mov.setComprobanteImagen(urlComprobante);

        mov.setPedido(pedido);

        MovimientoCaja movGuardado = cajaRepository.save(mov);

        if (pedido.getMovimientos() == null) {
            pedido.setMovimientos(new ArrayList<>());
        }
        pedido.getMovimientos().add(movGuardado);

        return pedido;
    }

    private String guardarArchivoFisico(MultipartFile archivo) {
    if (archivo == null || archivo.isEmpty()) {
        return null;
    }
    try {
        return supabaseStorageService.subirArchivo(archivo, "comprobantes");
    } catch (Exception e) {
        System.err.println("Error al subir el comprobante a Supabase: " + e.getMessage());
        e.printStackTrace();
        return null;
    }}

    @Override
    @Transactional
    public Pedido asociarArchivoAComprobanteExistente(Integer idComprobante, MultipartFile comprobante) {
        ComprobantePago comprobantePago = comprobantePagoRepository.findById(idComprobante)
            .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante no encontrado"));

        if (comprobante != null && !comprobante.isEmpty()) {

            String urlAnterior = comprobantePago.getUrlArchivoComprobante();

            String urlArchivo = guardarArchivoFisico(comprobante);
            comprobantePago.setUrlArchivoComprobante(urlArchivo);
            comprobantePagoRepository.save(comprobantePago);

            MovimientoCaja movimientoAsociado = buscarMovimientoAsociado(comprobantePago, urlAnterior);
            if (movimientoAsociado != null) {
                movimientoAsociado.setComprobanteImagen(urlArchivo);
                cajaRepository.save(movimientoAsociado);
            }
        }

        return comprobantePago.getPedido();
    }

    @Override
    @Transactional
    public Pedido agregarPagoConArchivo(Integer idPedido, Double monto, String tipoPago, Integer idUsuario, MultipartFile comprobante) {
        if (monto == null || monto.isNaN() || monto <= 0) {
            throw new SolicitudInvalidaException("El monto del pago debe ser un número mayor a 0.");
        }

        if (idUsuario == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que registra el cobro.");
        }
        Usuario usuarioOperador = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));

        Turno turnoActivo = TurnoRepository.findFirstByEstado(EstadoTurno.ABIERTO).orElse(null);
        if (turnoActivo == null) {
            throw new SolicitudInvalidaException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el pedido"));

        BigDecimal montoBD = BigDecimal.valueOf(monto);
        BigDecimal saldoPendiente = pedido.getMonto_total().subtract(pedido.getMonto_pago_adelantado());
        if (montoBD.compareTo(saldoPendiente) > 0) {
            throw new SolicitudInvalidaException(
                "El monto ingresado ($" + montoBD + ") no puede superar el saldo pendiente del pedido ($" + saldoPendiente + ")."
            );
        }

        if ("CUENTA_CORRIENTE".equalsIgnoreCase(tipoPago) || "Cuenta Corriente".equalsIgnoreCase(tipoPago)) {
            if (pedido.getCliente() != null && pedido.getCliente().getIdCliente() == 1) {
                throw new SolicitudInvalidaException("El Consumidor Final no puede usar Cuenta Corriente.");
            }
            pedido.setEs_cuenta_corriente(true);
        }

        pedido.setMonto_pago_adelantado(pedido.getMonto_pago_adelantado().add(montoBD));

        if (pedido.isEs_cuenta_corriente() && pedido.getCliente() != null && pedido.getCliente().getIdCliente() != 1) {
            Cliente c = pedido.getCliente();
            BigDecimal saldoActual = c.getSaldoDeudor() != null ? c.getSaldoDeudor() : BigDecimal.ZERO;
            BigDecimal nuevoSaldo = saldoActual.subtract(montoBD);
            if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                nuevoSaldo = BigDecimal.ZERO;
            }
            c.setSaldoDeudor(nuevoSaldo);
            clienteRepository.save(c);

            try {
                MovimientoCuentaCorriente movCC = new MovimientoCuentaCorriente();
                movCC.setCliente(c);
                movCC.setTipo("PAGO");
                movCC.setMonto(montoBD);
                movCC.setDescripcion("Pago / Abono de Pedido #" + idPedido);
                movCC.setFecha(LocalDateTime.now());
                movimientoCCRepository.save(movCC);
            } catch (Exception e) {
                System.err.println("Error al registrar movimiento CC en cobro: " + e.getMessage());
            }
        }

        String urlDeImagen = null;
        if (comprobante != null && !comprobante.isEmpty()) {
            urlDeImagen = guardarArchivoFisico(comprobante);
        }

        if (pedido.getComprobantes() == null) {
            pedido.setComprobantes(new ArrayList<>());
        }

        ComprobantePago nuevoCobro = new ComprobantePago();
        nuevoCobro.setPedido(pedido);
        nuevoCobro.setTipoPago(tipoPago);
        nuevoCobro.setMontoPago(montoBD);
        nuevoCobro.setFechaCarga(LocalDateTime.now());
        nuevoCobro.setUrlArchivoComprobante(urlDeImagen);

        pedido.getComprobantes().add(nuevoCobro);
        pedidoRepository.save(pedido);

        MovimientoCaja mov = new MovimientoCaja();
        mov.setTipoMovimiento("INGRESO");
        mov.setCategoria("VENTA");
        mov.setMonto(montoBD);
        mov.setMetodoPago(tipoPago);
        mov.setFecha(LocalDateTime.now());
        mov.setTurno(turnoActivo);

        String descripcion = "Cobro Pendiente de Pedido #" + idPedido;
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
            descripcion = "Venta Rápida";
        }
        mov.setDescripcion(descripcion);

        mov.setUsuario(usuarioOperador);

        mov.setComprobanteImagen(urlDeImagen);

        mov.setPedido(pedido);

        MovimientoCaja movGuardado = cajaRepository.save(mov);

        if (pedido.getMovimientos() == null) {
            pedido.setMovimientos(new ArrayList<>());
        }
        pedido.getMovimientos().add(movGuardado);

        return pedido;
    }
}
