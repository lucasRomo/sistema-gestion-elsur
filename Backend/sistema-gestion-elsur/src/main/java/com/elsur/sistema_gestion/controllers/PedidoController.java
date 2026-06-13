package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.services.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public Pedido crear(@RequestBody Pedido pedido) {
        return pedidoService.guardar(pedido);
    }

    @PatchMapping("/{id}/finalizar")
    public String finalizarPedido(@PathVariable Integer id) {
    pedidoService.procesarDescuentoStock(id);
    return "Pedido #" + id + " finalizado e insumos descontados correctamente.";
}
}