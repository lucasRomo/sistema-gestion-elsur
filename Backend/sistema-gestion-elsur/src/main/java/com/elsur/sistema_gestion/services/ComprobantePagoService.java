package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.ComprobantePago;
import java.util.List;

public interface ComprobantePagoService {
    ComprobantePago buscarPorId(Integer id);
    ComprobantePago guardar(ComprobantePago comprobantePago);
    List<ComprobantePago> listarComprobantesPorPedido(Integer idPedido);
}