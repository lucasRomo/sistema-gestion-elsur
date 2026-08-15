package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.categoriaCliente;
import com.elsur.sistema_gestion.repositories.categoriaClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias-cliente")
@CrossOrigin(origins = "*")
public class CategoriaClienteController {

    @Autowired
    private categoriaClienteRepository repository;

    @GetMapping
    public List<categoriaCliente> listar() {
        return repository.findAll();
    }

    @PostMapping
    public categoriaCliente guardar(@RequestBody categoriaCliente categoria) {
        return repository.save(categoria);
    }

    @PutMapping("/{id}")
    public categoriaCliente actualizar(@PathVariable Integer id, @RequestBody categoriaCliente categoriaDetalles) {
        return repository.findById(id).map(categoria -> {
            categoria.setNombre(categoriaDetalles.getNombre());
            categoria.setDescuentoAutomatico(categoriaDetalles.getDescuentoAutomatico());
            return repository.save(categoria);
        }).orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + id));
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        repository.deleteById(id);
    }
}