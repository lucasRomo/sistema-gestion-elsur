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

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        repository.deleteById(id);
    }
}