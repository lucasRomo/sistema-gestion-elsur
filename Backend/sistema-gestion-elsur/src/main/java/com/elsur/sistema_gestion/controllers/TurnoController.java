package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.services.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    @Autowired
    private TurnoService turnoService;

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaja(@RequestBody Turno turno) {
        Turno nuevoTurno = turnoService.abrirTurno(turno);
        return ResponseEntity.ok(nuevoTurno);
    }

    @PostMapping("/{id}/cerrar")
    public ResponseEntity<?> cerrarCaja(
    @PathVariable Integer id,
    @RequestParam Double montoReal,
    @RequestParam(required = false) String observaciones,
    @RequestParam(required = false) Integer idUsuario) {
        if (montoReal == null || montoReal < 0) {
            throw new SolicitudInvalidaException("El monto real contado no puede ser negativo.");
        }
        Turno turnoCerrado = turnoService.cerrarTurno(id, montoReal, observaciones, idUsuario);
        return ResponseEntity.ok(turnoCerrado);
    }

    @GetMapping("/estado-caja")
    public ResponseEntity<?> obtenerEstadoCaja() {
    Optional<Turno> turnoActivo = turnoService.obtenerTurnoAbiertoHoy();

    if (turnoActivo.isPresent()) {
        return ResponseEntity.ok(turnoActivo.get());
    }
    return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<Turno>> obtenerTodos() {
    return ResponseEntity.ok(turnoService.obtenerTodos());
    }

}
