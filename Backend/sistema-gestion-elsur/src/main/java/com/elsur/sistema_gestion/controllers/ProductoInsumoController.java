package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.ProductoInsumo;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos-insumos")
@CrossOrigin(origins = "*")
public class ProductoInsumoController {

    @Autowired
    private ProductoInsumoRepository productoInsumoRepository;

    @GetMapping
    public List<ProductoInsumo> listar() {
        return productoInsumoRepository.findAll();
    }

    @PostMapping
    public ProductoInsumo crear(@RequestBody ProductoInsumo productoInsumo) {
        return productoInsumoRepository.save(productoInsumo);
    }
    
    
}
