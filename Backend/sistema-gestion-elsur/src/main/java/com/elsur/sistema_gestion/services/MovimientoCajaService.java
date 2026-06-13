package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import java.util.List;

public interface MovimientoCajaService {
    MovimientoCaja buscarPorId(Integer id);
    MovimientoCaja guardar(MovimientoCaja movimientoCaja);
    List<MovimientoCaja> listarMovimientosPorPedido(Integer idPedido);
}