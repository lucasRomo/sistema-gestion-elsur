package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Factura;
import com.elsur.sistema_gestion.services.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@CrossOrigin(origins = "*")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @GetMapping("/{id}")
    public Factura buscarPorId(@PathVariable Integer id) {
        return facturaService.buscarPorId(id);
    }

    @PostMapping
    public Factura crear(@RequestBody Factura factura) {
        return facturaService.guardar(factura);
    }

    @GetMapping("/{id}/facturas")
    public List<Factura> listarFacturasPorPedido(@PathVariable Integer id) {
        return facturaService.listarFacturasPorPedido(id);
    }
}