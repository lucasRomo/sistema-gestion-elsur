package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

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

    @Autowired private TurnoRepository TurnoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired private UsuarioRepository UsuarioRepository;

    @Autowired
    private ComprobantePagoRepository comprobantePagoRepository;

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
    public Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante) {
    boolean existeCajaAbierta = TurnoRepository.existsByEstadoAndFechaAperturaToday(EstadoTurno.ABIERTO);
    if (!existeCajaAbierta) { 
        throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de continuar.");
    }

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

    // 4. Guardar Pedido en Postgres para que genere su ID autoincremental
    Pedido p = pedidoRepository.save(pedido);
    pedidoRepository.flush(); 

    // 5. Vincular empleado asignado si existe
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
        if (seña != null && seña.compareTo(BigDecimal.ZERO) > 0) {
        
        if (p.getComprobantes() == null) {
            p.setComprobantes(new java.util.ArrayList<>());
        }
        
        ComprobantePago nuevoCobro = new ComprobantePago();
        nuevoCobro.setPedido(p);
        
        String urlDeImagen = null;
        
        // ➔ LA CLAVE ESTÁ ACÁ: Establecemos el método según lo que seleccionó el usuario
        String tipoDePagoFinal = "EFECTIVO";
        
        if (tipoPago != null) {
            if (tipoPago.equalsIgnoreCase("Tarjeta / Transferencia") || tipoPago.equalsIgnoreCase("TRANSFERENCIA")) {
                tipoDePagoFinal = "TRANSFERENCIA";
            } else if (tipoPago.equalsIgnoreCase("Cuenta Corriente")) {
                tipoDePagoFinal = "CUENTA_CORRIENTE";
            }
        }

        // Si mandaron archivo, guardamos la imagen física y aseguramos que sea Transferencia
        if (comprobante != null && !comprobante.isEmpty()) {
            urlDeImagen = guardarArchivoFisico(comprobante);
            tipoDePagoFinal = "TRANSFERENCIA";
        }

        nuevoCobro.setTipoPago(tipoDePagoFinal); 
        nuevoCobro.setMontoPago(seña);
        nuevoCobro.setFechaCarga(LocalDateTime.now());
        nuevoCobro.setUrlArchivoComprobante(urlDeImagen);
        
        p.getComprobantes().add(nuevoCobro);

        // B. Registrar el ingreso automático en Caja
        try {
            MovimientoCaja movimiento = new MovimientoCaja();
            movimiento.setTipoMovimiento("INGRESO"); 
            movimiento.setMonto(seña);
            movimiento.setMetodoPago(tipoDePagoFinal); // Usa el tipo correcto corregido
            movimiento.setFecha(LocalDateTime.now());
            movimiento.setPedido(p);
            movimiento.setDescripcion("Seña/Adelanto inicial - Pedido #" + p.getId_pedido());

            Turno turnoActivo = TurnoRepository.findAll().stream()
                .filter(t -> t.getEstado() == EstadoTurno.ABIERTO)
                .findFirst()
                .orElse(null);
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

            cajaRepository.save(movimiento);
        } catch (Exception e) {
            System.err.println("Error al registrar movimiento automático de seña en caja: " + e.getMessage());
            e.printStackTrace(); 
        }
    }
    
    return pedidoRepository.save(p);
    }

    @Override
    public void asignarEmpleado(Integer idPedido, Integer idEmpleado) {
    // 1. Buscar el pedido
    Pedido pedido = pedidoRepository.findById(idPedido)
        .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

    // 2. Buscar el empleado
    Empleado empleado = empleadoRepository.findById(idEmpleado)
        .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

    // 3. Crear la nueva asignación
    AsignacionPedido nuevaAsignacion = new AsignacionPedido();
    nuevaAsignacion.setPedido(pedido);
    nuevaAsignacion.setEmpleado(empleado);
    nuevaAsignacion.setFecha_asignacion(LocalDateTime.now());

    // 4. Agregar a la lista de asignaciones del pedido
    pedido.getAsignaciones().add(nuevaAsignacion);

    // 5. Guardar el pedido (al tener CascadeType.ALL, guardará la asignación automáticamente)
    pedidoRepository.save(pedido);
}

@Override
@Transactional
public Pedido eliminarArchivoDeComprobante(Integer idComprobante) {
    ComprobantePago comprobante = comprobantePagoRepository.findById(idComprobante)
        .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));

    String urlArchivo = comprobante.getUrlArchivoComprobante();
    
  
    if (urlArchivo != null && !urlArchivo.isEmpty()) {
        try {
            String nombreArchivo = urlArchivo.replace("/uploads/", "");
            java.nio.file.Path ruta = java.nio.file.Paths.get("uploads").resolve(nombreArchivo);
            java.nio.file.Files.deleteIfExists(ruta);
        } catch (Exception e) {
            System.err.println("No se pudo borrar el archivo físico: " + e.getMessage());
        }
    }

    comprobante.setUrlArchivoComprobante(null);
    
   
    comprobantePagoRepository.saveAndFlush(comprobante); 

    return comprobante.getPedido();
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
    public Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante, Integer idUsuario) {
        // ➔ VALIDACIÓN: Verificar si la caja está abierta antes de tocar nada
        Turno turnoActivo = TurnoRepository.findTurnoAbiertoHoy();
        if (turnoActivo == null) {
            throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        // 1. Lógica del Pedido
        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RuntimeException("No se encontró el pedido"));

        BigDecimal montoBD = BigDecimal.valueOf(monto);
        pedido.setMonto_pago_adelantado(pedido.getMonto_pago_adelantado().add(montoBD));
        pedidoRepository.save(pedido);

        // 2. Registro en Caja
        MovimientoCaja mov = new MovimientoCaja();
        
        mov.setTipoMovimiento("INGRESO"); 
        mov.setMonto(montoBD);
        mov.setMetodoPago(tipoPago);    
        mov.setFecha(LocalDateTime.now());
        mov.setTurno(turnoActivo); // Ya sabemos que no es null

        String descripcion;
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
            descripcion = "Venta Rápida";
        } else {
            descripcion = "Cobro Pendiente de Pedido #" + idPedido;
        }
        mov.setDescripcion(descripcion);

        Usuario usuario = usuarioRepository.findById(idUsuario != null ? idUsuario : 1)
                            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        mov.setUsuario(usuario);

        cajaRepository.save(mov); 

        return pedido;
    }

    private String guardarArchivoFisico(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            return null;
        }
        try {
            String carpetaDestino = "uploads/"; 
            java.io.File directorio = new java.io.File(carpetaDestino);
            
            if (!directorio.exists()) {
                directorio.mkdirs();
            }

            String nombreOriginal = archivo.getOriginalFilename();
            String nombreSeguro = System.currentTimeMillis() + "_" + (nombreOriginal != null ? nombreOriginal.replaceAll("\\s+", "_") : "comprobante.png");
            
            java.nio.file.Path rutaCompleta = java.nio.file.Paths.get(carpetaDestino + nombreSeguro);
            java.nio.file.Files.write(rutaCompleta, archivo.getBytes());

            return "/uploads/" + nombreSeguro;
            
        } catch (Exception e) {
            System.err.println("Error al guardar el comprobante físico: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    @Transactional
    public Pedido asociarArchivoAComprobanteExistente(Integer idComprobante, MultipartFile comprobante) {
        // Buscamos el comprobante por su ID directamente
        ComprobantePago comprobantePago = comprobantePagoRepository.findById(idComprobante)
            .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));
            
        if (comprobante != null && !comprobante.isEmpty()) {
            String urlArchivo = guardarArchivoFisico(comprobante); // Guarda en tu directorio uploads/
            comprobantePago.setUrlArchivoComprobante(urlArchivo);
            comprobantePagoRepository.save(comprobantePago);
        }
        
        // Retornamos el pedido asociado actualizado para refrescar el frontend
        return comprobantePago.getPedido();
    }

    @Override
    @Transactional
    public Pedido agregarPagoConArchivo(Integer idPedido, Double monto, String tipoPago, Integer idUsuario, MultipartFile comprobante) {
        // ➔ VALIDACIÓN: Verificar si la caja está abierta antes de tocar nada
        Turno turnoActivo = TurnoRepository.findTurnoAbiertoHoy();
        if (turnoActivo == null) {
            throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        // 1. Buscamos el Pedido
        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RuntimeException("No se encontró el pedido"));
        
        BigDecimal montoBD = BigDecimal.valueOf(monto);
        pedido.setMonto_pago_adelantado(pedido.getMonto_pago_adelantado().add(montoBD));

        // 2. Procesamos el archivo físico si viene adjunto
        String urlDeImagen = null;
        if (comprobante != null && !comprobante.isEmpty()) {
            urlDeImagen = guardarArchivoFisico(comprobante);
        }

        // 3. Crear el Comprobante de Pago asociado
        if (pedido.getComprobantes() == null) {
            pedido.setComprobantes(new java.util.ArrayList<>());
        }
        
        ComprobantePago nuevoCobro = new ComprobantePago();
        nuevoCobro.setPedido(pedido);
        nuevoCobro.setTipoPago(tipoPago); 
        nuevoCobro.setMontoPago(montoBD);
        nuevoCobro.setFechaCarga(LocalDateTime.now());
        nuevoCobro.setUrlArchivoComprobante(urlDeImagen);
        
        pedido.getComprobantes().add(nuevoCobro);
        pedidoRepository.save(pedido);

        // 4. Registro del movimiento en Caja
        MovimientoCaja mov = new MovimientoCaja();
        mov.setTipoMovimiento("INGRESO"); 
        mov.setMonto(montoBD);
        mov.setMetodoPago(tipoPago);
        mov.setFecha(LocalDateTime.now());
        mov.setTurno(turnoActivo); // Ya sabemos que no es null

        String descripcion = "Cobro Pendiente de Pedido #" + idPedido;
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
            descripcion = "Venta Rápida";
        }
        mov.setDescripcion(descripcion);

        Usuario usuario = usuarioRepository.findById(idUsuario != null ? idUsuario : 1)
                            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        mov.setUsuario(usuario);

        cajaRepository.save(mov); 

        return pedido;
    }
}