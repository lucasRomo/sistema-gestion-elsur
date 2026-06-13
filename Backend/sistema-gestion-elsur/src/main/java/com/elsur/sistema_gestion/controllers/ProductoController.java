package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.services.ProductoService; // Importamos el Service
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoService productoService; // Cambiamos Repository por Service

    @GetMapping
    public List<Producto> listar() {
        return productoService.listarTodos();
    }

    @PostMapping
    public Producto crear(@RequestBody Producto producto) {
        return productoService.guardar(producto);
    }

    // Este es el método que te faltaba y por eso te daba 404
    @PatchMapping("/actualizar-precios")
    public String actualizarPrecios(@RequestParam double porcentaje) {
        productoService.actualizarPreciosMasivo(porcentaje);
        return "Precios actualizados con éxito en un " + porcentaje + "%";
    }
}
