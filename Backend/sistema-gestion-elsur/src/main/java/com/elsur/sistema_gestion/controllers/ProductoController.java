package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public List<Producto> listar() {
        return productoService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<Producto> crear(
            @RequestBody Producto producto,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(productoService.guardar(producto, idUsuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizar(
            @PathVariable Integer id,
            @RequestBody Producto producto,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        producto.setIdProducto(id);
        return ResponseEntity.ok(productoService.guardar(producto, idUsuario));
    }

    // Este es el método que te faltaba y por eso te daba 404
    @PatchMapping("/actualizar-precios")
    public String actualizarPrecios(@RequestParam double porcentaje) {
        productoService.actualizarPreciosMasivo(porcentaje);
        return "Precios actualizados con éxito en un " + porcentaje + "%";
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        productoService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}
