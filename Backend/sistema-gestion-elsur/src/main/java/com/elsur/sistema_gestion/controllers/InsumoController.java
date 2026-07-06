package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.services.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/insumos")
@CrossOrigin(origins = "*")
public class InsumoController {

    @Autowired
    private InsumoService insumoService; // Ahora inyectamos el Service

    @GetMapping
    public List<Insumo> listar() {
        return insumoService.listarTodos();
    }

    @PostMapping
    public Insumo crear(@RequestBody Insumo insumo) {
        return insumoService.guardar(insumo);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        insumoService.eliminar(id);
    }
}