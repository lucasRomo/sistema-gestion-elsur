package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.CategoriaProducto;
import com.elsur.sistema_gestion.repositories.CategoriaRepository;
import com.elsur.sistema_gestion.services.CategoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService; 

    @GetMapping
    public List<CategoriaProducto> listar() {
        return categoriaService.listarTodas();
    }

    @PostMapping
    public CategoriaProducto registrar(@RequestBody CategoriaProducto categoria) {
        if (categoria.getNombre() == null || categoria.getNombre().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre de la categoría no puede estar vacío.");
        }
        return categoriaService.guardar(categoria);
    }

@DeleteMapping("/{id}")
public void eliminar(@PathVariable Integer id) {
    categoriaService.eliminar(id);
}
}