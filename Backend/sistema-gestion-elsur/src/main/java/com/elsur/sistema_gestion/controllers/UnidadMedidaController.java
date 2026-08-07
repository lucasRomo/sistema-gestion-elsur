package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.services.UnidadMedidaService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public UnidadMedida guardar(@RequestBody UnidadMedida unidadMedida) {
        return unidadMedidaService.guardar(unidadMedida);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        unidadMedidaService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}