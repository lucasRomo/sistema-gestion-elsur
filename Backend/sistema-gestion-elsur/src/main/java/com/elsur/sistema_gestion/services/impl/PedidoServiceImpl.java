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
        if (pedido.getDetalles() != null) {
            pedido.getDetalles().forEach(detalle -> detalle.setPedido(pedido));
        }

        // Si es un pedido nuevo, le ponemos estado PENDIENTE por defecto
        if (pedido.getId_pedido() == null) {
            pedido.setEstado("PENDIENTE");
            pedido.setFecha_creacion(LocalDateTime.now());
        }

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // Registro inicial en el Historial (RF11)
        // Pasamos el pedido guardado, el estado anterior ("NUEVO") y el nuevo ("PENDIENTE")
        registrarHistorial(pedidoGuardado, "NUEVO", "PENDIENTE");

        // Registro en caja
        MovimientoCaja ingreso = new MovimientoCaja();
        ingreso.setTipoMovimiento("INGRESO");
        ingreso.setMonto(pedidoGuardado.getMonto_total());
        ingreso.setDescripcion("Venta pedido Nro: " + pedidoGuardado.getId_pedido());
        ingreso.setFecha(LocalDateTime.now());

        // IMPORTANTE: Como tu modelo tiene el campo pedido, lo seteamos:
        ingreso.setPedido(pedidoGuardado);

        cajaRepository.save(ingreso);

        return pedidoGuardado;
    }

    @Override
    @Transactional
    public void procesarDescuentoStock(Integer idPedido) {
        Pedido pedido = buscarPorId(idPedido);
        
        // Asegúrate de que los detalles no sean null y no estén vacíos
        if (pedido.getDetalles() == null || pedido.getDetalles().isEmpty()) {
            throw new RuntimeException("El pedido no tiene detalles");
        }

        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            
            // Asegúrate de que el producto y la cantidad sean correctos
            if (producto == null || detalle.getCantidad() <= 0) {
                throw new RuntimeException("Datos incorrectos en el detalle del pedido");
            }

            int cantidadVendida = detalle.getCantidad();

            List<ProductoInsumo> recetas = productoInsumoRepository.findByProducto(producto);

            for (ProductoInsumo receta : recetas) {
                Insumo insumo = receta.getInsumo();
                
                // Asegúrate de que la cantidad de consumo y el stock sean correctos
                if (receta.getCantidadConsumo() == null || insumo.getStockActual() == null) {
                    throw new RuntimeException("Datos incorrectos en las recetas del producto");
                }

                BigDecimal cantidadUsadaPorUnidad = receta.getCantidadConsumo();
                BigDecimal cantidadVendidaBD = new BigDecimal(cantidadVendida);
                BigDecimal cantidadADescontar = cantidadUsadaPorUnidad.multiply(cantidadVendidaBD);

                BigDecimal nuevoStock = insumo.getStockActual().subtract(cantidadADescontar);
                if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) {
                    throw new RuntimeException("No hay suficiente stock para el producto " + producto.getIdProducto());
                }
                insumo.setStockActual(nuevoStock);

                insumoRepository.save(insumo);
            }
        }

        // Al descontar stock, entendemos que el trabajo se hizo
        actualizarEstado(idPedido, "FINALIZADO");
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
    private void registrarHistorial(Pedido pedido, String anterior, String nuevo) {
        HistorialEstadoPedido historial = new HistorialEstadoPedido();
        historial.setPedido(pedido);
        historial.setEstado_anterior(anterior);
        historial.setEstado_nuevo(nuevo);
        historial.setFecha_cambio(LocalDateTime.now());
        // Si ya tuvieras el sistema de Login, acá iría: 
        // historial.setUsuarioResponsable(usuarioActual);

        historialRepository.save(historial);
    }
}