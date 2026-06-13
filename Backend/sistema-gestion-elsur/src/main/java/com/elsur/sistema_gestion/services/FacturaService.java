package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Factura;
import java.util.List;

public interface FacturaService {
    Factura buscarPorId(Integer id);
    Factura guardar(Factura factura);
    List<Factura> listarFacturasPorPedido(Integer idPedido);
}