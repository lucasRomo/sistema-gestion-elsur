package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.services.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
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

    @PostMapping(value = "/{idIncidencia}/pago-mantenimiento", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registrarPagoMantenimiento(
            @PathVariable Integer idIncidencia,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "metodoPago", defaultValue = "EFECTIVO") String metodoPago,
            @RequestParam(value = "descripcion", defaultValue = "") String descripcion,
            @RequestParam("idUsuario") Integer idUsuario,
            @RequestParam(value = "forzarSaldoInsuficiente", defaultValue = "false") boolean forzar,
            @RequestParam(value = "comprobante", required = false) MultipartFile comprobante) {
        try {
            MovimientoCaja mov = incidenciaService.registrarPagoMantenimiento(
                    idIncidencia, monto, metodoPago, descripcion, idUsuario, forzar, comprobante
            );
            
            return ResponseEntity.ok(mov);
        // CORREGIDO -- HALLAZGO: este endpoint arma su propia respuesta { code,
        // message } en vez de dejar pasar la excepción al GlobalExceptionHandler, y
        // antes solo distinguía IllegalStateException/IllegalArgumentException. Las
        // nuevas RecursoNoEncontradoException (incidencia/máquina inexistente) y
        // SolicitudInvalidaException (monto inválido, usuario ausente/inexistente)
        // agregadas en IncidenciaServiceImpl cAÍAN en el catch-all de más abajo,
        // devolviendo 500 "Internal Server Error" -- como si fuera un bug del
        // servidor -- en vez del 404/400 que realmente corresponde.
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("code", "NOT_FOUND", "message", e.getMessage()));
        } catch (SolicitudInvalidaException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("code", "SOLICITUD_INVALIDA", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("code", "CAJA_CERRADA", "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("code", "SALDO_INSUFFICIENT", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("code", "ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Incidencia>> listarTodas() {
        return ResponseEntity.ok(incidenciaService.listarTodas());
    }
}