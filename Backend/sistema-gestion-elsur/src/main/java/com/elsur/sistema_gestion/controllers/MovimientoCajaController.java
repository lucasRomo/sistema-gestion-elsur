package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movimientos-caja")
@CrossOrigin(origins = "*")
public class MovimientoCajaController {

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @GetMapping("/{id}")
    public ResponseEntity<MovimientoCaja> buscarPorId(@PathVariable Integer id) {
        MovimientoCaja movimiento = movimientoCajaService.buscarPorId(id);
        return movimiento != null ? ResponseEntity.ok(movimiento) : ResponseEntity.notFound().build();
    }

    @GetMapping("/dia")
    public ResponseEntity<List<MovimientoCaja>> listarMovimientosDelDia() { 
        return ResponseEntity.ok(movimientoCajaService.listarMovimientosDelDia());
    }

    @PostMapping
    public ResponseEntity<MovimientoCaja> crear(@RequestBody MovimientoCaja movimientoCaja) {
        return ResponseEntity.ok(movimientoCajaService.guardar(movimientoCaja));
    }

    @GetMapping("/{id}/movimientos")
    public ResponseEntity<List<MovimientoCaja>> listarMovimientosPorPedido(@PathVariable Integer id) {
        return ResponseEntity.ok(movimientoCajaService.listarMovimientosPorPedido(id));
    }

    @GetMapping("/totales")
    public ResponseEntity<Map<String, Double>> obtenerTotalesCaja() {
        return ResponseEntity.ok(movimientoCajaService.calcularTotalesDelDia());
    }

    @GetMapping
    public ResponseEntity<List<MovimientoCaja>> obtenerTodos() {
        return ResponseEntity.ok(movimientoCajaService.obtenerTodos());
    }

    @GetMapping("/desglose-arqueo")
    public ResponseEntity<Map<String, Double>> obtenerDesgloseArqueo() {
        return ResponseEntity.ok(movimientoCajaService.obtenerDesgloseArqueo());
    }

    @GetMapping("/turno/{idTurno}")
    public ResponseEntity<List<MovimientoCaja>> listarMovimientosPorTurno(@PathVariable Integer idTurno) {
        return ResponseEntity.ok(movimientoCajaService.listarMovimientosPorTurno(idTurno));
    }
}