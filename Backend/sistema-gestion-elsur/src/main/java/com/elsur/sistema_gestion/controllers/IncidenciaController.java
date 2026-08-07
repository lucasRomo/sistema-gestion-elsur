package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
@CrossOrigin(origins = "*")
public class IncidenciaController {

    @Autowired
    private IncidenciaService incidenciaService;

    @GetMapping("/maquina/{idMaquina}")
    public ResponseEntity<List<Incidencia>> obtenerPorMaquina(@PathVariable Integer idMaquina) {
        return ResponseEntity.ok(incidenciaService.obtenerPorMaquina(idMaquina));
    }

    @PostMapping("/reportar")
    public ResponseEntity<Incidencia> reportarFalla(@RequestBody Map<String, Object> payload) {
        Integer idMaquina = Integer.parseInt(payload.get("idMaquina").toString());
        String descripcion = payload.get("descripcion").toString();
        String prioridad = payload.get("prioridad") != null ? payload.get("prioridad").toString() : "MEDIA";
        Integer idEmpleadoReporta = payload.get("idEmpleadoReporta") != null ? 
                Integer.parseInt(payload.get("idEmpleadoReporta").toString()) : null;

        Incidencia incidencia = incidenciaService.registrarFalla(idMaquina, descripcion, prioridad, idEmpleadoReporta);
        return ResponseEntity.ok(incidencia);
    }

    @PutMapping("/{idIncidencia}/mantenimiento")
    public ResponseEntity<Incidencia> ponerEnMantenimiento(
            @PathVariable Integer idIncidencia,
            @RequestBody Map<String, Object> payload) {
        String notaMantenimiento = payload.get("notaMantenimiento") != null ? payload.get("notaMantenimiento").toString() : "";
        Integer idEmpleadoMantenimiento = payload.get("idEmpleadoMantenimiento") != null ? 
                Integer.parseInt(payload.get("idEmpleadoMantenimiento").toString()) : null;

        Incidencia res = incidenciaService.ponerEnMantenimiento(idIncidencia, notaMantenimiento, idEmpleadoMantenimiento);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{idIncidencia}/resolver")
    public ResponseEntity<Incidencia> resolverIncidencia(
            @PathVariable Integer idIncidencia,
            @RequestBody Map<String, Object> payload) {
        String resolucion = payload.get("resolucion").toString();
        Integer idEmpleadoResuelve = payload.get("idEmpleadoResuelve") != null ? 
                Integer.parseInt(payload.get("idEmpleadoResuelve").toString()) : null;

        Incidencia res = incidenciaService.resolverIncidencia(idIncidencia, resolucion, idEmpleadoResuelve);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{idIncidencia}/pago-mantenimiento")
    public ResponseEntity<?> registrarPagoMantenimiento(
            @PathVariable Integer idIncidencia,
            @RequestBody Map<String, Object> payload) {
        try {
            BigDecimal monto = new BigDecimal(payload.get("monto").toString());
            String metodoPago = payload.get("metodoPago") != null ? payload.get("metodoPago").toString() : "EFECTIVO";
            String descripcion = payload.get("descripcion") != null ? payload.get("descripcion").toString() : "";
            Integer idUsuario = Integer.parseInt(payload.get("idUsuario").toString());
            boolean forzar = payload.get("forzarSaldoInsuficiente") != null && Boolean.parseBoolean(payload.get("forzarSaldoInsuficiente").toString());

            MovimientoCaja mov = incidenciaService.registrarPagoMantenimiento(idIncidencia, monto, metodoPago, descripcion, idUsuario, forzar);
            return ResponseEntity.ok(mov);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("code", "CAJA_CERRADA", "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("code", "SALDO_INSUFICIENTE", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("code", "ERROR", "message", e.getMessage()));
        }
    }
}