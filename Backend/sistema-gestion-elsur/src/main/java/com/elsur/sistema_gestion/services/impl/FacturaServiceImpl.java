package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Factura;
import com.elsur.sistema_gestion.repositories.FacturaRepository;
import com.elsur.sistema_gestion.services.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FacturaServiceImpl implements FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;

    @Override
    public Factura buscarPorId(Integer id) {
        return facturaRepository.findById(id).orElse(null);
    }

    @Override
    public Factura guardar(Factura factura) {
        return facturaRepository.save(factura);
    }

    @Override
    public List<Factura> listarFacturasPorPedido(Integer idPedido) {
        return facturaRepository.findByPedidoId(idPedido);
    }
}