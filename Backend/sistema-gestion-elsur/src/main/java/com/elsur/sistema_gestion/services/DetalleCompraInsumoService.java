package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.DetalleCompraInsumo;
import com.elsur.sistema_gestion.repositories.DetalleCompraInsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetalleCompraInsumoService {

    @Autowired
    private DetalleCompraInsumoRepository detalleCompraInsumoRepository;

    public List<DetalleCompraInsumo> findAll() {
        return detalleCompraInsumoRepository.findAll();
    }

    public DetalleCompraInsumo save(DetalleCompraInsumo detalleCompraInsumo) {
        return detalleCompraInsumoRepository.save(detalleCompraInsumo);
    }
}