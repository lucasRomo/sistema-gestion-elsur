package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.services.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}