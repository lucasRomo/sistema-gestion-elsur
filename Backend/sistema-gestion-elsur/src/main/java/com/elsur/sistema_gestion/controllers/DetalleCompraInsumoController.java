package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.services.DetalleCompraInsumoService;
import com.elsur.sistema_gestion.models.DetalleCompraInsumo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/detalles-compra-insumo")
public class DetalleCompraInsumoController {

    @Autowired
    private DetalleCompraInsumoService detalleCompraInsumoService;

    @GetMapping
    public List<DetalleCompraInsumo> getAll() {
        return detalleCompraInsumoService.findAll();
    }


    @PostMapping
    public DetalleCompraInsumo create(@RequestBody DetalleCompraInsumo detalleCompraInsumo) {
        return detalleCompraInsumoService.save(detalleCompraInsumo);
    }
}