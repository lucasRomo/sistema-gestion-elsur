package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movimientos-caja")
public class MovimientoCajaController {

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

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
    public ResponseEntity<MovimientoCaja> crear(@Valid @RequestBody MovimientoCaja movimientoCaja) {
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

    @GetMapping("/totales/turno/{idTurno}")
    public ResponseEntity<Map<String, Double>> obtenerTotalesPorTurno(@PathVariable Integer idTurno) {
    return ResponseEntity.ok(movimientoCajaService.calcularTotalesPorTurno(idTurno));
    }

    @GetMapping("/desglose-arqueo/turno/{idTurno}")
    public ResponseEntity<Map<String, Double>> obtenerDesgloseArqueoPorTurno(@PathVariable Integer idTurno) {
    return ResponseEntity.ok(movimientoCajaService.obtenerDesgloseArqueoPorTurno(idTurno));
    }

    @PostMapping(value = "/comprobante", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Map<String, String>> subirComprobante(
        @RequestPart("archivo") org.springframework.web.multipart.MultipartFile archivo) {
    try {
        String path = supabaseStorageService.subirArchivo(archivo, "comprobantes");
        return ResponseEntity.ok(Map.of("path", path));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

@GetMapping("/comprobante/{nombreArchivo:.+}")
public ResponseEntity<byte[]> verComprobante(@PathVariable String nombreArchivo) {
    try {
        byte[] datos = supabaseStorageService.descargarArchivo("comprobantes", nombreArchivo);
        String contentType = supabaseStorageService.detectarContentType(nombreArchivo);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .body(datos);
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
}
}