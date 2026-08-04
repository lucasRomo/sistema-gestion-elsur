package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.services.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PatchMapping("/actualizar-precios")
    public ResponseEntity<String> actualizarPrecios(
            @RequestBody Map<String, Object> payload,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        
        double porcentaje = payload.get("porcentaje") != null ? Double.parseDouble(payload.get("porcentaje").toString()) : 0.0;
        Integer idCategoria = payload.get("idCategoria") != null ? Integer.parseInt(payload.get("idCategoria").toString()) : null;
        Integer idProveedor = payload.get("idProveedor") != null ? Integer.parseInt(payload.get("idProveedor").toString()) : null;
        String criterio = payload.get("criterio") != null ? payload.get("criterio").toString() : "TODOS";
        
        @SuppressWarnings("unchecked")
        List<Integer> idsProductos = (List<Integer>) payload.get("idsProductos");

        productoService.actualizarPreciosMasivo(porcentaje, idCategoria, idProveedor, idsProductos, criterio, idUsuario);
        return ResponseEntity.ok("Precios actualizados con éxito en un " + porcentaje + "%");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        productoService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}