package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimientos-caja")
@CrossOrigin(origins = "*")
public class MovimientoCajaController {

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @GetMapping("/{id}")
    public MovimientoCaja buscarPorId(@PathVariable Integer id) {
        return movimientoCajaService.buscarPorId(id);
    }

    @PostMapping
    public MovimientoCaja crear(@RequestBody MovimientoCaja movimientoCaja) {
        return movimientoCajaService.guardar(movimientoCaja);
    }

    @GetMapping("/{id}/movimientos")
    public List<MovimientoCaja> listarMovimientosPorPedido(@PathVariable Integer id) {
        return movimientoCajaService.listarMovimientosPorPedido(id);
    }
}