package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Proveedor;
import com.elsur.sistema_gestion.services.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "*")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

    @GetMapping
    public List<Proveedor> listar() {
        return proveedorService.listarTodos();
    }

    @PostMapping
    public Proveedor crear(@RequestBody Proveedor proveedor) {
        return proveedorService.guardar(proveedor);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        proveedorService.eliminar(id);
    }
}