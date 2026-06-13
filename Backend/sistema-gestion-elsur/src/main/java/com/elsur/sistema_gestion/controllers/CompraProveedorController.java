package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.services.CompraProveedorService;
import com.elsur.sistema_gestion.models.CompraProveedor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compras-proveedor")
public class CompraProveedorController {

    @Autowired
    private CompraProveedorService compraProveedorService;

    @GetMapping
    public List<CompraProveedor> getAll() {
        return compraProveedorService.findAll();
    }

    @PostMapping
    public CompraProveedor create(@RequestBody CompraProveedor compraProveedor) {
        return compraProveedorService.save(compraProveedor);
    }
}