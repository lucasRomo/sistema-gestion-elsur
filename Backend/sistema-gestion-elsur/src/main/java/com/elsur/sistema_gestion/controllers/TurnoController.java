package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.services.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    @Autowired
    private TurnoService turnoService;

    /**
     * POST /api/turnos/abrir
     * Abre un nuevo turno. Si ya existe uno abierto o ya se cerró hoy, 
     * el servicio lanzará una excepción y este método devolverá un error 400.
     */
    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody Turno turno) {
        try {
            Turno nuevoTurno = turnoService.abrirTurno(turno);
            return ResponseEntity.ok(nuevoTurno);
        } catch (RuntimeException e) {
            // Retorna el mensaje de error definido en el Service (ej: "El turno de hoy ya fue cerrado...")
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * POST /api/turnos/{id}/cerrar?montoReal=1000.00
     * Cierra el turno especificado realizando el arqueo.
     */
    @PostMapping("/{id}/cerrar")
    public ResponseEntity<?> cerrarCaja(
    @PathVariable Integer id,
    @RequestParam Double montoReal,
    @RequestParam(required = false) String observaciones,
    @RequestParam(required = false) Integer idUsuario) {
    try {
        Turno turnoCerrado = turnoService.cerrarTurno(id, montoReal, observaciones, idUsuario);
        return ResponseEntity.ok(turnoCerrado);
    } catch (RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
    }

    @GetMapping("/estado-caja")
    public ResponseEntity<?> obtenerEstadoCaja() {
    // Llamamos al nuevo método de la interfaz TurnoService
    Optional<Turno> turnoActivo = turnoService.obtenerTurnoAbiertoHoy();
    
    if (turnoActivo.isPresent()) {
        return ResponseEntity.ok(turnoActivo.get()); // Retorna el objeto Turno (con su idTurno)
    }
    return ResponseEntity.ok(null); // Retorna null si la caja está cerrada
    }

    @GetMapping
    public ResponseEntity<List<Turno>> obtenerTodos() {
    return ResponseEntity.ok(turnoService.obtenerTodos());
    }
    
}