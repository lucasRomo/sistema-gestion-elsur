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
public class UnidadMedidaController {

    @Autowired
    private UnidadMedidaService unidadMedidaService;

    @GetMapping
    public List<UnidadMedida> listar() {
        return unidadMedidaService.obtenerTodas();
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody UnidadMedida unidadMedida) {
        UnidadMedida guardada = unidadMedidaService.guardar(unidadMedida);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        unidadMedidaService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}
