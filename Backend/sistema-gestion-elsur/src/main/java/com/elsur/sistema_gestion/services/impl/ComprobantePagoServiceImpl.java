package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.ComprobantePago;
import com.elsur.sistema_gestion.repositories.ComprobantePagoRepository;
import com.elsur.sistema_gestion.services.ComprobantePagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ComprobantePagoServiceImpl implements ComprobantePagoService {

    @Autowired
    private ComprobantePagoRepository comprobantePagoRepository;

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Override
    public ComprobantePago buscarPorId(Integer id) {
        return comprobantePagoRepository.findById(id).orElse(null);
    }

    @Override
    public ComprobantePago guardar(ComprobantePago comprobantePago) {
        // Dejamos que solo guarde el comprobante sin intentar buscar un usuario inexistente en Pedido
        return comprobantePagoRepository.save(comprobantePago);
    }

    @Override
    public List<ComprobantePago> listarComprobantesPorPedido(Integer idPedido) {
        return comprobantePagoRepository.findByPedidoId(idPedido);
    }
}