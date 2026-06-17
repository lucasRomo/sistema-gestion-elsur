package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @GetMapping
    public List<Pedido> listar() {
        return pedidoService.listarTodos();
    }

    @PostMapping
public ResponseEntity<?> crear(@RequestBody Pedido pedido) {
    try {
        Pedido guardado = pedidoService.guardar(pedido);
        return ResponseEntity.ok(guardado);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error al guardar pedido: " + e.getMessage());
    }
}

    @PatchMapping("/{id}/finalizar")
public ResponseEntity<?> finalizarPedido(@PathVariable Integer id) {
    try {
        pedidoService.procesarDescuentoStock(id);
        return ResponseEntity.ok("Pedido #" + id + " finalizado correctamente.");
    } catch (RuntimeException e) {
        // Aquí capturamos el "Stock insuficiente..." y lo devolvemos con estado 400
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


}