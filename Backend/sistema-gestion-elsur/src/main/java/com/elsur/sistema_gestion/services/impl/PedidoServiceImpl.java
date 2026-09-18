package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.PedidoService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
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
                .orElseThrow(() -> new EntityNotFoundException("Pedido no encontrado con ID: " + idPedido));

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

        Usuario usuario = usuarioRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Error: No existe ningún usuario para registrar el historial."));
        historial.setUsuarioResponsable(usuario);

        historialRepository.save(historial);
    }

    @Override
    @Transactional
    public Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante,
                           boolean confirmarMaquinaNoDisponible) {
        boolean existeCajaAbierta = TurnoRepository.existsByEstado(EstadoTurno.ABIERTO);
        if (!existeCajaAbierta) {
            throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de continuar.");
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
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        pedido.setCliente(clienteActual);

        if (pedido.getDetalles() != null) {
            for (DetallePedido detalle : pedido.getDetalles()) {
                detalle.setPedido(pedido);
                if (detalle.getProducto() != null && detalle.getProducto().getIdProducto() != null) {
                    Producto prod = productoRepository.findById(detalle.getProducto().getIdProducto())
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                    detalle.setProducto(prod);
                } else {
                    // Antes esto se dejaba pasar en silencio: un detalle sin producto (o con
                    // un producto sin idProducto) llegaba así hasta procesarDescuentoStock,
                    // que hace detalle.getProducto().getStockVinculado() sin chequear null ->
                    // NullPointerException. En el alta normal esa excepción terminaba tragada
                    // (ver más abajo), así que el pedido se guardaba igual con un detalle roto;
                    // si más tarde alguien finalizaba ese pedido, la misma NPE volvía a saltar
                    // pero esta vez sin nada que la atajara. Cortamos acá, con un mensaje claro,
                    // antes de que el detalle llegue a guardarse.
                    throw new SolicitudInvalidaException(
                        "Cada detalle del pedido debe indicar un producto válido (falta el producto o su id).");
                }
            }
        }

        if ("PRESUPUESTO".equalsIgnoreCase(pedido.getEstado())) {
            pedido.setEs_presupuesto(true);
        }

        boolean esCuentaCorriente = (tipoPago != null && (tipoPago.equalsIgnoreCase("Cuenta Corriente") || tipoPago.equalsIgnoreCase("CUENTA_CORRIENTE")))
                                    || (pedido.isEs_cuenta_corriente());

        if (idCliente == 1 && esCuentaCorriente) {
            throw new RuntimeException("El Consumidor Final no puede realizar compras a Cuenta Corriente.");
        }

        if (esCuentaCorriente) {
            pedido.setEs_cuenta_corriente(true);
        }

        Pedido p = pedidoRepository.save(pedido);
        pedidoRepository.flush();

        if (idEmpleado != null) {
            Empleado emp = empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
            AsignacionPedido asignacion = new AsignacionPedido();
            asignacion.setPedido(p);
            asignacion.setEmpleado(emp);
            asignacion.setFecha_asignacion(LocalDateTime.now());
            asignacionRepository.save(asignacion);
        }

        BigDecimal seña = p.getMonto_pago_adelantado();

        // Validación que faltaba: el formulario de Crear Pedido manda este campo
        // como <input type="number"> sin min="0" y nada del lado del cliente
        // impedía tipear un monto negativo. Si eso llegaba hasta acá, quedaba
        // persistido tal cual en Pedido.monto_pago_adelantado (un "pago negativo"
        // sin sentido), sin siquiera generar el ComprobantePago/MovimientoCaja de
        // abajo (que solo corre con seña > 0) -- el dato quedaba corrupto y en
        // silencio.
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
                // GENERACIÓN DEL TICKET MEDIANTE MOVIMIENTO DE CAJA
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

        if (p.isEs_cuenta_corriente() && idCliente != 1) {
            BigDecimal total = p.getMonto_total() != null ? p.getMonto_total() : BigDecimal.ZERO;
            BigDecimal adelanto = seña != null ? seña : BigDecimal.ZERO;
            BigDecimal saldoPendienteGenerado = total.subtract(adelanto);

            if (saldoPendienteGenerado.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal saldoActual = clienteActual.getSaldoDeudor() != null ? clienteActual.getSaldoDeudor() : BigDecimal.ZERO;
                clienteActual.setSaldoDeudor(saldoActual.add(saldoPendienteGenerado));
                clienteRepository.save(clienteActual);

                try {
                    MovimientoCuentaCorriente movCC = new MovimientoCuentaCorriente();
                    movCC.setCliente(clienteActual);
                    movCC.setTipo("COMPRA");
                    movCC.setMonto(saldoPendienteGenerado);
                    movCC.setDescripcion("Compra a Cuenta Corriente - Pedido #" + p.getId_pedido());
                    movCC.setFecha(LocalDateTime.now());
                    movimientoCCRepository.save(movCC);
                } catch (Exception e) {
                    System.err.println("Error al registrar historial de Cuenta Corriente: " + e.getMessage());
                }
            }
        }

        boolean esVentaRapidaAlAlta = p.getObservaciones() != null && p.getObservaciones().contains("Venta Rápida");

        // HALLAZGO de este trabajo: Crear Pedido (alta formal) permite elegir
        // "Estado / Destino" = ENTREGADO directamente en el mismo formulario que
        // arma el pedido (ver DetallesPedidoForm.tsx) -- no es exclusivo de
        // "Cambiar estado" después. Antes, esta rama de guardar() solo disparaba
        // procesarDescuentoStock() para Venta Rápida; un pedido formal creado ya
        // en ENTREGADO se guardaba tal cual, SIN descontar stock, SIN validar
        // insumos ni máquina -- quedaba marcado como entregado sin que el
        // inventario se haya tocado nunca. Ahora cualquier pedido que nazca ya en
        // un estado final corre la misma validación que Venta Rápida.
        boolean creadoDirectoEnEstadoFinal = "ENTREGADO".equalsIgnoreCase(p.getEstado())
                || "FINALIZADO".equalsIgnoreCase(p.getEstado());

        if (esVentaRapidaAlAlta || creadoDirectoEnEstadoFinal) {
            // Antes, cualquier falla acá (stock insuficiente, máquina fuera de servicio,
            // un detalle sin producto válido) se tragaba en silencio: el pedido quedaba
            // igual guardado con HTTP 200, con parte del stock ya descontado (lo que sí
            // llegó a procesarse antes de la excepción) y sin descontar el resto. Un
            // "Cambiar estado a FINALIZADO" posterior volvía a correr
            // procesarDescuentoStock desde cero y descontaba una segunda vez lo que ya
            // se había descontado acá (bug de doble descuento). Dejamos que la excepción
            // se propague: @Transactional hace que TODO este guardar() se revierta (el
            // pedido, sus detalles, el comprobante/movimiento de caja si ya se habían
            // armado, el ajuste de cuenta corriente) en vez de dejar una venta a medias.
            this.procesarDescuentoStock(p.getId_pedido(), confirmarMaquinaNoDisponible);
            p = pedidoRepository.findById(p.getId_pedido()).orElse(p);
        }

        return pedidoRepository.save(p);
    }

    @Override
    @Transactional
    public void asignarEmpleado(Integer idPedido, Integer idEmpleado) {
        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        Empleado empleadoNuevo = empleadoRepository.findById(idEmpleado)
            .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String nombreEmpleadoAnterior = "Sin Asignar";
        if (pedido.getAsignaciones() != null && !pedido.getAsignaciones().isEmpty()) {
            AsignacionPedido ultima = pedido.getAsignaciones().get(pedido.getAsignaciones().size() - 1);
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

        Usuario usuario = usuarioRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Error: No existe ningún usuario para registrar el historial."));
        historial.setUsuarioResponsable(usuario);

        historialRepository.save(historial);
        pedidoRepository.save(pedido);
    }

    @Override
    @Transactional
    public Pedido eliminarArchivoDeComprobante(Integer idComprobante) {
        ComprobantePago comprobante = comprobantePagoRepository.findById(idComprobante)
            .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));

        String urlArchivo = comprobante.getUrlArchivoComprobante();

        // Buscamos ANTES de tocar nada el MovimientoCaja que quedó con la
        // misma imagen guardada (Caja guarda una copia propia de la url,
        // no una referencia viva al comprobante).
        MovimientoCaja movimientoAsociado = buscarMovimientoAsociado(comprobante, urlArchivo);

        if (urlArchivo != null && !urlArchivo.isEmpty()) {
        supabaseStorageService.eliminarArchivo("comprobantes", urlArchivo);
        }

        comprobante.setUrlArchivoComprobante(null);
        comprobantePagoRepository.saveAndFlush(comprobante);

        // Sincronizamos Caja: si no la actualizamos acá, el movimiento
        // se queda apuntando a un archivo que ya borramos del disco
        // (por eso "se bugea" en la vista de Caja).
        if (movimientoAsociado != null) {
            movimientoAsociado.setComprobanteImagen(null);
            cajaRepository.save(movimientoAsociado);
        }

        return comprobante.getPedido();
    }

    /**
     * Caja (MovimientoCaja) guarda su propia copia de la url del comprobante
     * en lugar de referenciar al ComprobantePago, así que no hay una forma
     * directa de saber qué movimiento corresponde a qué comprobante.
     * La correlacionamos por pedido + monto + método de pago + la url que
     * tenía guardada, que es lo mismo que se usó al crear ambos registros
     * juntos (ver agregarPagoConArchivo / procesarYGuardarPedido).
     */
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
        // Variante estricta: nunca deja pasar una máquina caída sin confirmación
        // explícita. La usa PATCH /{id}/finalizar, que hoy no tiene ningún flujo
        // de aviso/confirmación del lado del frontend.
        procesarDescuentoStock(idPedido, false);
    }

    @Override
    @Transactional
    public void procesarDescuentoStock(Integer idPedido, boolean confirmarMaquinaNoDisponible) {
    Pedido pedido = pedidoRepository.findById(idPedido)
        .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

    // Guarda de idempotencia (ver Pedido.stockDescontado): si este pedido ya
    // descontó su stock una vez -- ya sea porque el alta de Venta Rápida lo hizo
    // al vuelo, o porque ya se había finalizado antes -- correrlo de nuevo (por
    // ejemplo, un cambio de estado FINALIZADO -> PENDIENTE -> FINALIZADO) no debe
    // volver a tocar ni Insumo.stockActual ni Producto.stock. Antes la única
    // guarda vivía en cambiarEstadoPedido() comparando strings de estado, y no
    // cubría todos los caminos que llegan acá (por ejemplo, PATCH /finalizar).
    if (pedido.isStockDescontado()) {
        return;
    }

    if (pedido.getDetalles().isEmpty()) {
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(idPedido);
        pedido.setDetalles(detalles);
    }

    if (pedido.getDetalles().isEmpty()) {
        throw new RuntimeException("El pedido no tiene detalles registrados");
    }

    for (DetallePedido detalle : pedido.getDetalles()) {
        Producto producto = detalle.getProducto();
        if (producto == null) {
            throw new SolicitudInvalidaException(
                "El pedido tiene un detalle sin producto válido; no se puede procesar el stock.");
        }

        // Validación de máquina: es una decisión de negocio que las máquinas NO
        // son un bloqueo duro -- el operario puede ver el aviso en el frontend y
        // elegir "Continuar de todos modos" igual. Por default (sin confirmación
        // explícita) el backend rechaza la venta si el producto necesita una
        // máquina puntual y esa máquina está FUERA DE SERVICIO / con FALLA / en
        // MANTENIMIENTO -- así una llamada directa a la API (sin pasar por el
        // aviso del frontend) no puede saltearse el chequeo. Si
        // confirmarMaquinaNoDisponible llega en true (el operario ya vio el aviso
        // y decidió seguir igual), dejamos pasar la venta. "no aplica" (o sin
        // nombre cargado) se sigue tratando como "no hace falta ninguna máquina en
        // particular", igual que en el frontend.
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

        // SI EL PRODUCTO ES "AUTO" / VINCULADO A INSUMOS (Receta)
        if (Boolean.TRUE.equals(producto.getStockVinculado())) {
            List<ProductoInsumo> receta = productoInsumoRepository.findByIdIdProducto(producto.getIdProducto());

            for (ProductoInsumo pi : receta) {
                Insumo insumo = pi.getInsumo();
                BigDecimal consumoTotal = pi.getCantidadConsumo()
                        .multiply(BigDecimal.valueOf(detalle.getCantidad()));

                if (insumo.getStockActual().compareTo(consumoTotal) < 0) {
                    throw new RuntimeException("Stock insuficiente del insumo '" + insumo.getNombreInsumo() +
                            "' para producir el producto " + producto.getNombreProducto());
                }

                insumo.setStockActual(insumo.getStockActual().subtract(consumoTotal));
                insumoRepository.save(insumo);
            }
        }
        // SI ES UN PRODUCTO INDEPENDIENTE (Controla su propio stock directo)
        else {
            if (producto.getStock() != null) {
                int nuevoStock = producto.getStock() - detalle.getCantidad();
                if (nuevoStock < 0) {
                    throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombreProducto());
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

        Usuario usuario = usuarioRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Error: No existe ningún usuario en la base de datos para registrar el historial."));

        historial.setUsuarioResponsable(usuario);
        historialRepository.save(historial);
    }

    @Override
    @Transactional
    public Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario,
                                       boolean confirmarMaquinaNoDisponible) {
        Pedido pedido = buscarPorId(idPedido);
        String estadoAnterior = pedido.getEstado();

        boolean esEstadoFinal = "FINALIZADO".equalsIgnoreCase(nuevoEstado) || "ENTREGADO".equalsIgnoreCase(nuevoEstado);
        boolean yaEstabaFinalizado = "FINALIZADO".equalsIgnoreCase(estadoAnterior) || "ENTREGADO".equalsIgnoreCase(estadoAnterior) || "VENTA_RAPIDA".equalsIgnoreCase(estadoAnterior);

        if (esEstadoFinal && !yaEstabaFinalizado) {
            // Antes acá había un try/catch que envolvía cualquier excepción
            // (incluida una simple "stock insuficiente") en un RuntimeException
            // nuevo con mensaje genérico "Error al procesar stock: ...". Eso
            // tapaba el tipo real de la excepción sin aportar nada: la dejamos
            // propagarse tal cual la tira procesarDescuentoStock y la resuelve
            // el GlobalExceptionHandler.
            this.procesarDescuentoStock(idPedido, confirmarMaquinaNoDisponible);
            pedido = buscarPorId(idPedido);

            pedido.setEstado(nuevoEstado);
            if ("FINALIZADO".equalsIgnoreCase(nuevoEstado)) {
                pedido.setFecha_finalizacion(LocalDateTime.now());
            }

            pedidoRepository.save(pedido);

            // NUEVO (bug reportado: "no se descontó el saldo corriente al crear un
            // pedido con límite de saldo = 0 al usar el botón Autorizar solo esta
            // vez. No aparece en el historial de ese cliente tampoco"): este método
            // es al que llegan TANTO "Actualizar Límite y Entregar" COMO "Autorizar
            // Solo Esta Vez" (ver ModalAdvertenciaDeuda / PedidosPendientesView --
            // los dos terminan llamando a este mismo cambiarEstadoPedido con los
            // mismos parámetros), y ninguno de los dos ajustaba la cuenta corriente:
            // acá nunca se tocaba Cliente.saldoDeudor ni se generaba un
            // MovimientoCuentaCorriente al entregar. La única vez que el proyecto sí
            // hacía este ajuste era al CREAR un pedido ya en un estado final (ver
            // procesarYGuardarPedido, más arriba en esta clase) -- pero un pedido que
            // se crea PENDIENTE y se entrega después, pasando por acá, no quedaba
            // nunca reflejado. Se replica el mismo patrón: si al entregar/finalizar
            // queda saldo pendiente, se suma a la cuenta corriente del cliente (salvo
            // Consumidor Final, id 1, que no opera con cuenta corriente) y se deja
            // asentado el movimiento, igual que en el alta.
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

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseGet(() -> usuarioRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No hay usuarios cargados en el sistema")));

        historial.setUsuarioResponsable(usuario);
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
                throw new RuntimeException("El Consumidor Final no puede usar Cuenta Corriente.");
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
            .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));

        if (comprobante != null && !comprobante.isEmpty()) {
            // Guardamos la url "vieja" para poder encontrar el MovimientoCaja
            // asociado ANTES de pisarla con la nueva.
            String urlAnterior = comprobantePago.getUrlArchivoComprobante();

            String urlArchivo = guardarArchivoFisico(comprobante);
            comprobantePago.setUrlArchivoComprobante(urlArchivo);
            comprobantePagoRepository.save(comprobantePago);

            // Sincronizamos Caja con el nuevo archivo vinculado; si no,
            // el movimiento en Caja se queda sin comprobante aunque en
            // Gestión de Comprobantes ya aparezca vinculado.
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
                throw new RuntimeException("El Consumidor Final no puede usar Cuenta Corriente.");
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
