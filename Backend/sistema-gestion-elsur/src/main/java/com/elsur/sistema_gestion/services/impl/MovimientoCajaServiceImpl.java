package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MovimientoCajaServiceImpl implements MovimientoCajaService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Override
    public MovimientoCaja buscarPorId(Integer id) {
        return movimientoCajaRepository.findById(id).orElse(null);
    }

    @Override
    public MovimientoCaja guardar(MovimientoCaja movimientoCaja) {
        return movimientoCajaRepository.save(movimientoCaja);
    }

    @Override
    public List<MovimientoCaja> listarMovimientosPorPedido(Integer idPedido) {
        return movimientoCajaRepository.findByCajaId(idPedido);
    }
}