package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Pedido;
import java.util.List;

public interface PedidoService {
    List<Pedido> listarTodos();
    Pedido guardar(Pedido pedido, Integer idEmpleado);
    Pedido buscarPorId(Integer id);
    void procesarDescuentoStock(Integer idPedido);
    void actualizarEstado(Integer idPedido, String nuevoEstado);
    Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario);
    Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante); // Para el historial
}