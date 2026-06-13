package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.HistorialEstadoPedido;
import com.elsur.sistema_gestion.repositories.HistorialEstadoPedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HistorialEstadoPedidoService {

    @Autowired
    private HistorialEstadoPedidoRepository historialEstadoPedidoRepository;

    public HistorialEstadoPedido buscarPorId(Integer id) {
        return historialEstadoPedidoRepository.findById(id).orElse(null);
    }

    public HistorialEstadoPedido guardar(HistorialEstadoPedido historialEstadoPedido) {
        return historialEstadoPedidoRepository.save(historialEstadoPedido);
    }

    public List<HistorialEstadoPedido> listarHistoricoPorPedido(Integer idPedido) {
        return historialEstadoPedidoRepository.findByPedidoId(idPedido);
    }
}