package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.DetallePedido;
import java.util.List;

public interface DetallePedidoService {
    DetallePedido guardar(DetallePedido detalle);
    List<DetallePedido> listarPorPedido(Integer idPedido);
}