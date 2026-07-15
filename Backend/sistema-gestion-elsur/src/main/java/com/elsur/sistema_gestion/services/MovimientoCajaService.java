package com.elsur.sistema_gestion.services;
import java.util.Map;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;

import java.util.List;

public interface MovimientoCajaService {
    MovimientoCaja buscarPorId(Integer id);
    MovimientoCaja guardar(MovimientoCaja movimientoCaja);
    List<MovimientoCaja> listarMovimientosPorPedido(Integer idPedido);
    List<MovimientoCaja> listarMovimientosDelDia();
    Map<String, Double> calcularTotalesDelDia();
}

