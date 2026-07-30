package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.services.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/insumos")
@CrossOrigin(origins = "*")
public class InsumoController {

    @Autowired
    private InsumoService insumoService;

    @GetMapping
    public List<Insumo> listar() {
        return insumoService.listarTodos();
    }

    @GetMapping("/bajo-stock")
    public List<Insumo> listarBajoStock() {
        return insumoService.listarInsumosBajoStock();
    }

    @PostMapping
    public ResponseEntity<Insumo> crear(
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Insumo> actualizar(
            @PathVariable Integer id,
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        insumo.setIdInsumo(id);
        return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        insumoService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}