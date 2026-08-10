package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.PedidoService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (pedido.getHistoriales() != null) {
            pedido.getHistoriales().size();
        }
        
        if (pedido.getComprobantes() != null) { 
            pedido.getComprobantes().size(); 
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
    public Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoPago, MultipartFile comprobante) {
        boolean existeCajaAbierta = TurnoRepository.existsByEstadoAndFechaAperturaToday(EstadoTurno.ABIERTO);
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
        if (seña != null && seña.compareTo(BigDecimal.ZERO) > 0) {
            
            if (p.getComprobantes() == null) {
                p.setComprobantes(new java.util.ArrayList<>());
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
                movimiento.setMonto(seña);
                movimiento.setMetodoPago(tipoDePagoFinal);
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
        
        // Descuento automático de stock si se trata de Venta Rápida
        if (p.getObservaciones() != null && p.getObservaciones().contains("Venta Rápida")) {
            try {
                this.procesarDescuentoStock(p.getId_pedido());
                p = pedidoRepository.findById(p.getId_pedido()).orElse(p);
            } catch (Exception e) {
                System.err.println("Aviso: El descuento de stock de Venta Rápida se procesará en la actualización de estado: " + e.getMessage());
            }
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
            pedido.setAsignaciones(new java.util.ArrayList<>());
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

        if (pedido.getDetalles().isEmpty()) {
            List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdPedido(idPedido);
            pedido.setDetalles(detalles);
        }

        if (pedido.getDetalles().isEmpty()) {
            throw new RuntimeException("El pedido no tiene detalles registrados");
        }

        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            
            // 1. Descuento del stock directo del producto final (si aplica)
            if (producto.getStock() != null) {
                int nuevoStock = producto.getStock() - detalle.getCantidad();
                if (nuevoStock < 0) {
                    throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombreProducto());
                }
                producto.setStock(nuevoStock);
                productoRepository.save(producto);
            }

            // 2. Descuento del stock de insumos según la Receta (US GP.34)
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
        
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("Venta Rápida")) {
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
    public Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario) {
        Pedido pedido = buscarPorId(idPedido);
        String estadoAnterior = pedido.getEstado();

        boolean esEstadoFinal = "FINALIZADO".equalsIgnoreCase(nuevoEstado) || "ENTREGADO".equalsIgnoreCase(nuevoEstado);
        boolean yaEstabaFinalizado = "FINALIZADO".equalsIgnoreCase(estadoAnterior) || "ENTREGADO".equalsIgnoreCase(estadoAnterior) || "VENTA_RAPIDA".equalsIgnoreCase(estadoAnterior);

        if (esEstadoFinal && !yaEstabaFinalizado) {
            try {
                this.procesarDescuentoStock(idPedido);
                pedido = buscarPorId(idPedido);
                
                pedido.setEstado(nuevoEstado);
                if ("FINALIZADO".equalsIgnoreCase(nuevoEstado)) {
                    pedido.setFecha_finalizacion(LocalDateTime.now());
                }
                
                pedidoRepository.save(pedido);
            } catch (Exception e) {
                throw new RuntimeException("Error al procesar stock: " + e.getMessage());
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
        Turno turnoActivo = TurnoRepository.findTurnoAbiertoHoy();
        if (turnoActivo == null) {
            throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RuntimeException("No se encontró el pedido"));

        if ("CUENTA_CORRIENTE".equalsIgnoreCase(tipoPago) || "Cuenta Corriente".equalsIgnoreCase(tipoPago)) {
            if (pedido.getCliente() != null && pedido.getCliente().getIdCliente() == 1) {
                throw new RuntimeException("El Consumidor Final no puede usar Cuenta Corriente.");
            }
            pedido.setEs_cuenta_corriente(true);
        }

        BigDecimal montoBD = BigDecimal.valueOf(monto);
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
        ComprobantePago comprobantePago = comprobantePagoRepository.findById(idComprobante)
            .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));
            
        if (comprobante != null && !comprobante.isEmpty()) {
            String urlArchivo = guardarArchivoFisico(comprobante);
            comprobantePago.setUrlArchivoComprobante(urlArchivo);
            comprobantePagoRepository.save(comprobantePago);
        }
        
        return comprobantePago.getPedido();
    }

    @Override
    @Transactional
    public Pedido agregarPagoConArchivo(Integer idPedido, Double monto, String tipoPago, Integer idUsuario, MultipartFile comprobante) {
        Turno turnoActivo = TurnoRepository.findTurnoAbiertoHoy();
        if (turnoActivo == null) {
            throw new RuntimeException("La Caja No está Abierta. Por favor, inicie turno antes de registrar el cobro.");
        }

        Pedido pedido = pedidoRepository.findById(idPedido)
            .orElseThrow(() -> new RuntimeException("No se encontró el pedido"));

        if ("CUENTA_CORRIENTE".equalsIgnoreCase(tipoPago) || "Cuenta Corriente".equalsIgnoreCase(tipoPago)) {
            if (pedido.getCliente() != null && pedido.getCliente().getIdCliente() == 1) {
                throw new RuntimeException("El Consumidor Final no puede usar Cuenta Corriente.");
            }
            pedido.setEs_cuenta_corriente(true);
        }
        
        BigDecimal montoBD = BigDecimal.valueOf(monto);
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

        MovimientoCaja mov = new MovimientoCaja();
        mov.setTipoMovimiento("INGRESO"); 
        mov.setMonto(montoBD);
        mov.setMetodoPago(tipoPago);
        mov.setFecha(LocalDateTime.now());
        mov.setTurno(turnoActivo);

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