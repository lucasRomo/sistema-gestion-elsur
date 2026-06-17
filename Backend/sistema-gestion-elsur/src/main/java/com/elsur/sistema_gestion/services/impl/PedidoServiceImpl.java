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
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
    }

   @Override
@Transactional
public Pedido guardar(Pedido pedido) {
    // 1. Validar Cliente
    Integer idCliente = (pedido.getCliente() != null && pedido.getCliente().getIdCliente() != null) 
                        ? pedido.getCliente().getIdCliente() : 1;
    pedido.setCliente(clienteRepository.findById(idCliente)
        .orElseThrow(() -> new RuntimeException("Cliente no encontrado")));

    // 2. IMPORTANTE: Vincular detalles al pedido padre
    if (pedido.getDetalles() != null) {
        for (DetallePedido detalle : pedido.getDetalles()) {
            detalle.setPedido(pedido); // Esto es lo que faltaba
            // Aseguramos que el producto exista
            if (detalle.getProducto() != null && detalle.getProducto().getIdProducto() != null) {
                Producto prod = productoRepository.findById(detalle.getProducto().getIdProducto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
                detalle.setProducto(prod);
            }
        }
    }

    // 3. Guardar y Volcar
    Pedido p = pedidoRepository.save(pedido);
    pedidoRepository.flush(); // Asegura que los IDs se generen
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
    
    pedido.setEstado("Finalizado");
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
}