package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.TipoProveedor;
import com.elsur.sistema_gestion.services.TipoProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-proveedor")
@CrossOrigin(origins = "*") // Si tenés una config global de CORS en tu Filter de Security, podés quitar esto
public class TipoProveedorController {

    @Autowired
    private TipoProveedorService tipoProveedorService;

    // GET - http://localhost:8080/api/tipos-proveedor
    @GetMapping
    public List<TipoProveedor> listarTodos() {
        return tipoProveedorService.listarTodo();
    }

    // POST - http://localhost:8080/api/tipos-proveedor
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TipoProveedor crear(@RequestBody TipoProveedor tipoProveedor) {
        return tipoProveedorService.guardar(tipoProveedor);
    }

    // DELETE - http://localhost:8080/api/tipos-proveedor/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        tipoProveedorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}