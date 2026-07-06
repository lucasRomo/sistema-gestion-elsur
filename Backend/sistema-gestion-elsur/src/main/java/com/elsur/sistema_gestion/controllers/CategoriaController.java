package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Categoria;
import com.elsur.sistema_gestion.repositories.CategoriaRepository;
import com.elsur.sistema_gestion.services.CategoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*") // Permite que React se conecte
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService; // Ahora inyectamos el Service

    @GetMapping
    public List<Categoria> listar() {
        return categoriaService.listarTodas();
    }

    @PostMapping
    public Categoria registrar(@RequestBody Categoria categoria) {
        return categoriaService.guardar(categoria);
    }

    // Dentro de CategoriaController.java
@DeleteMapping("/{id}")
public void eliminar(@PathVariable Integer id) {
    categoriaService.eliminar(id);
}
}