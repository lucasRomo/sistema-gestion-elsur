package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Pedido;
import java.util.List;

public interface PedidoService {
    List<Pedido> listarTodos();
    Pedido guardar(Pedido pedido);
    Pedido buscarPorId(Integer id);
    void procesarDescuentoStock(Integer idPedido);
    void actualizarEstado(Integer idPedido, String nuevoEstado); // Para el historial
}