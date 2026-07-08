package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PedidoServiceImpl implements PedidoService {

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private ProductoInsumoRepository productoInsumoRepository;
    @Autowired private MovimientoCajaRepository cajaRepository;
    @Autowired private HistorialEstadoPedidoRepository historialRepository;
    @Autowired private ClienteRepository clienteRepository;

    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private AsignacionPedidoRepository asignacionRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository; // <--- AGREGÁ ESTO

    @Autowired
    private ProductoRepository productoRepository;
    @Override
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    @Override
public Pedido buscarPorId(Integer id) {
    Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

    if (pedido.getHistoriales() != null) {
        pedido.getHistoriales().size();
    }
    
    // AGREGA ESTO PARA QUE SE CARGUEN LOS COBROS:
    if (pedido.getComprobantes() != null) { 
        pedido.getComprobantes().size(); 
    }

    return pedido;
}

   @Override
@Transactional
public Pedido guardar(Pedido pedido, Integer idEmpleado) {
    // 1. Validar Cliente
    Integer idCliente = (pedido.getCliente() != null && pedido.getCliente().getIdCliente() != null) 
                        ? pedido.getCliente().getIdCliente() : 1;
    pedido.setCliente(clienteRepository.findById(idCliente)
        .orElseThrow(() -> new RuntimeException("Cliente no encontrado")));

    // 2. Vincular detalles del carrito de productos
    if (pedido.getDetalles() != null) {
        for (DetallePedido detalle : pedido.getDetalles()) {
            detalle.setPedido(pedido);
            if (detalle.getProducto() != null && detalle.getProducto().getIdProducto() != null) {
                Producto prod = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                detalle.setProducto(prod);
            }
        }
    }

    // 3. Forzar el flag booleano si la cadena de estado es PRESUPUESTO
    if ("PRESUPUESTO".equalsIgnoreCase(pedido.getEstado())) {
        pedido.setEs_presupuesto(true);
    }

    // 4. Guardar Pedido en Postgres
    Pedido p = pedidoRepository.save(pedido);
    pedidoRepository.flush(); 

    // 5. Crear la Asignación en la tabla intermedia (Aplica tanto a pedidos como a presupuestos confeccionados)
    if (idEmpleado != null) {
        Empleado emp = empleadoRepository.findById(idEmpleado)
            .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
            
        AsignacionPedido asignacion = new AsignacionPedido();
        asignacion.setPedido(p);
        asignacion.setEmpleado(emp);
        asignacion.setFecha_asignacion(LocalDateTime.now());
        asignacionRepository.save(asignacion);
    }
    
    return p;
}

@Override
@Transactional
public void procesarDescuentoStock(Integer idPedido) {
    Pedido pedido = pedidoRepository.findById(idPedido)
        .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

    // Si sigue vacía, forzamos la carga por si el fetchType es LAZY
    if (pedido.getDetalles().isEmpty()) {
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(idPedido);
        pedido.setDetalles(detalles);
    }

    if (pedido.getDetalles().isEmpty()) {
        throw new RuntimeException("El pedido no tiene detalles registrados");
    }

    for (DetallePedido detalle : pedido.getDetalles()) {
        Producto producto = detalle.getProducto();
        // Lógica de stock
        int nuevoStock = producto.getStock() - detalle.getCantidad();
        if (nuevoStock < 0) throw new RuntimeException("Stock insuficiente para " + producto.getNombreProducto());
        
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
    }
    
    if ("Venta Rápida".equals(pedido.getObservaciones())) {
        pedido.setEstado("VENTA_RAPIDA");
    } else {
        pedido.setEstado("ENTREGADO");
    }
    pedido.setFecha_finalizacion(LocalDateTime.now());
    pedidoRepository.save(pedido);
}

    @Override
    @Transactional
    public void actualizarEstado(Integer idPedido, String nuevoEstado) {
        Pedido pedido = buscarPorId(idPedido);
        String estadoAnterior = pedido.getEstado(); // Guardamos el viejo antes de cambiarlo

        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);

        // Pasamos ambos estados al historial
        registrarHistorial(pedido, estadoAnterior, nuevoEstado);
    }

    // Método auxiliar para que coincida con tu modelo de HistorialEstadoPedido
    @Autowired
private UsuarioRepository usuarioRepository; // Asegúrate de inyectarlo

private void registrarHistorial(Pedido pedido, String anterior, String nuevo) {
    HistorialEstadoPedido historial = new HistorialEstadoPedido();
    historial.setPedido(pedido);
    historial.setEstado_anterior(anterior);
    historial.setEstado_nuevo(nuevo);
    historial.setFecha_cambio(LocalDateTime.now());
    
    // Busca el primer usuario que encuentre, sin importar el ID
    Usuario usuario = usuarioRepository.findAll().stream()
        .findFirst()
        .orElseThrow(() -> new RuntimeException("Error: No existe ningún usuario en la base de datos para registrar el historial."));
    
    historial.setUsuarioResponsable(usuario);
    historialRepository.save(historial);
}

@Override
@Transactional
public Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario) {
    Pedido pedido = buscarPorId(idPedido);
    String estadoAnterior = pedido.getEstado();

    // 1. Lógica de Descuento de Stock y Forzado de Estado
    boolean esEstadoFinal = "FINALIZADO".equalsIgnoreCase(nuevoEstado) || "ENTREGADO".equalsIgnoreCase(nuevoEstado);
    boolean yaEstabaFinalizado = "FINALIZADO".equalsIgnoreCase(estadoAnterior) || "ENTREGADO".equalsIgnoreCase(estadoAnterior) || "VENTA_RAPIDA".equalsIgnoreCase(estadoAnterior);

    if (esEstadoFinal && !yaEstabaFinalizado) {
        try {
            // Ejecuta tu lógica original que ajusta el stock
            this.procesarDescuentoStock(idPedido);
            
            // Recargamos el pedido para asegurarnos de tener la instancia fresca del stock
            pedido = buscarPorId(idPedido);
            
            // ➔ SOLUCIÓN: Forzamos a que respete el estado que elegiste en la pantalla
            pedido.setEstado(nuevoEstado);
            if ("FINALIZADO".equalsIgnoreCase(nuevoEstado)) {
                pedido.setFecha_finalizacion(LocalDateTime.now());
            }
            
            pedidoRepository.save(pedido);
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar stock: " + e.getMessage());
        }
    } else {
        // Si no se procesó stock (o ya estaba finalizado), actualizamos el estado normalmente
        pedido.setEstado(nuevoEstado);
        if (esEstadoFinal) {
            pedido.setFecha_finalizacion(LocalDateTime.now());
        }
        pedidoRepository.save(pedido);
    }

    // 2. Registro en Historial (usamos el estado definitivo del pedido)
    HistorialEstadoPedido historial = new HistorialEstadoPedido();
    historial.setPedido(pedido);
    historial.setEstado_anterior(estadoAnterior);
    historial.setEstado_nuevo(pedido.getEstado());
    historial.setFecha_cambio(LocalDateTime.now()); // Nota: Asegurate si es fecha_cambio o fecha_change en tu entidad
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
public Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante) {
    Pedido pedido = buscarPorId(idPedido);

    // 1. Validar y actualizar montos acumulados en el pedido numérico
    if (monto != null && monto > 0) {
        BigDecimal nuevoAdelantado = pedido.getMonto_pago_adelantado().add(BigDecimal.valueOf(monto));
        if (nuevoAdelantado.compareTo(pedido.getMonto_total()) > 0) {
            throw new RuntimeException("El monto ingresado supera el saldo total del pedido.");
        }
        pedido.setMonto_pago_adelantado(nuevoAdelantado);
        
        // ====================================================================
        // CREACIÓN Y GUARDADO DEL COMPROBANTE INDIVIDUAL (Mapeo exacto a tu entidad)
        // ====================================================================
        
        // Inicializamos la lista por las dudas para evitar NullPointerException
        if (pedido.getComprobantes() == null) {
            pedido.setComprobantes(new java.util.ArrayList<>());
        }

        // Instanciamos el nuevo comprobante usando los atributos exactos de tu @Entity
        ComprobantePago nuevoCobro = new ComprobantePago();
        nuevoCobro.setPedido(pedido);
        nuevoCobro.setTipoPago(tipoPago != null ? tipoPago.toUpperCase() : "EFECTIVO");
        nuevoCobro.setMontoPago(BigDecimal.valueOf(monto)); // Coincide con tu 'private BigDecimal montoPago;'
        nuevoCobro.setFechaCarga(LocalDateTime.now());       // Coincide con tu 'private LocalDateTime fechaCarga;'
        
        // Si viene la URL de la transferencia (el archivo), se guarda acá
        if (urlComprobante != null && !urlComprobante.trim().isEmpty()) {
            nuevoCobro.setUrlArchivoComprobante(urlComprobante);
        } else {
            nuevoCobro.setUrlArchivoComprobante(null);
        }

        // Lo metemos al array del pedido para que el CascadeType.ALL haga el insert automático en la BD
        pedido.getComprobantes().add(nuevoCobro);
    }

    // 2. Registrar opcionalmente la entrada en Caja
    try {
        if (monto != null && monto > 0) {
            MovimientoCaja movimiento = new MovimientoCaja();
            // Tu lógica de caja actual si la usás...
            // cajaRepository.save(movimiento);
        }
    } catch (Exception e) {
        System.err.println("Error al registrar movimiento de caja: " + e.getMessage());
    }

    // Guardamos el pedido (esto persiste el saldo actualizado y mete la nueva fila en la tabla ComprobantePago)
    return pedidoRepository.save(pedido);
}
}