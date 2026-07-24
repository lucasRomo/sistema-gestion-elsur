package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Proveedor;
import com.elsur.sistema_gestion.services.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Proveedor> crear(
            @RequestBody Proveedor proveedor,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(proveedorService.guardar(proveedor, idUsuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proveedor> actualizar(
            @PathVariable Integer id,
            @RequestBody Proveedor proveedor,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        proveedor.setIdProveedor(id);
        return ResponseEntity.ok(proveedorService.guardar(proveedor, idUsuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        proveedorService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}