package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.HistorialEstadoPedido;
import com.elsur.sistema_gestion.services.HistorialEstadoPedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historiales-estado")
@CrossOrigin(origins = "*")
public class HistorialEstadoPedidoController {

    @Autowired
    private HistorialEstadoPedidoService historialEstadoPedidoService;

    @GetMapping("/{id}")
    public HistorialEstadoPedido buscarPorId(@PathVariable Integer id) {
        return historialEstadoPedidoService.buscarPorId(id);
    }

    @PostMapping
    public HistorialEstadoPedido crear(@RequestBody HistorialEstadoPedido historialEstadoPedido) {
        return historialEstadoPedidoService.guardar(historialEstadoPedido);
    }

    @GetMapping("/{id}/historico")
    public List<HistorialEstadoPedido> listarHistoricoPorPedido(@PathVariable Integer id) {
        return historialEstadoPedidoService.listarHistoricoPorPedido(id);
    }
}