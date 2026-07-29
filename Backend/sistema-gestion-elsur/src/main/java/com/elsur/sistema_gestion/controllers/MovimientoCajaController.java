package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/movimientos-caja")
@CrossOrigin(origins = "*")
public class MovimientoCajaController {

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @Autowired
    private MovimientoCajaService movimientoService;

    @GetMapping("/{id}")
    public MovimientoCaja buscarPorId(@PathVariable Integer id) {
        return movimientoCajaService.buscarPorId(id);
    }

    @GetMapping("/dia")
    public List<MovimientoCaja> listarMovimientosDelDia() { 
    return movimientoCajaService.listarMovimientosDelDia();
}

    @PostMapping
    public MovimientoCaja crear(@RequestBody MovimientoCaja movimientoCaja) {
        return movimientoCajaService.guardar(movimientoCaja);
    }

    @GetMapping("/{id}/movimientos")
    public List<MovimientoCaja> listarMovimientosPorPedido(@PathVariable Integer id) {
        return movimientoCajaService.listarMovimientosPorPedido(id);
    }

    @GetMapping("/totales")
    public ResponseEntity<?> obtenerTotalesCaja() {
    // Aquí invocas a tu servicio para sumar los movimientos del turno abierto
    Map<String, Double> totales = movimientoService.calcularTotalesDelDia(); 
    return ResponseEntity.ok(totales);
}
    @GetMapping
    public ResponseEntity<List<MovimientoCaja>> obtenerTodos() {
        List<MovimientoCaja> movimientos = movimientoCajaService.obtenerTodos();
        return ResponseEntity.ok(movimientos);
    }
}