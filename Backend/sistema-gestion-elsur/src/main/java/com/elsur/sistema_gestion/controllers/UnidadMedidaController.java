package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.services.UnidadMedidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unidades-medida")
@CrossOrigin(origins = "*")
public class UnidadMedidaController {

    @Autowired
    private UnidadMedidaService unidadMedidaService;

    @GetMapping
    public List<UnidadMedida> listar() {
        return unidadMedidaService.obtenerTodas();
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody UnidadMedida unidadMedida) {
        try {
            UnidadMedida guardada = unidadMedidaService.guardar(unidadMedida);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar la solicitud en el servidor.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        unidadMedidaService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}