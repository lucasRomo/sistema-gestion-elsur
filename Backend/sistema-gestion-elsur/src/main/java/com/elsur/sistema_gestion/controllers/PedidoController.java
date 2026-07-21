package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.services.PedidoService;

import tools.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> payload) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            
            // Si el JSON viene envuelto en una clave "pedido", lo extraemos, 
            // de lo contrario, mapeamos directamente todo el payload.
            Object datosPedido = payload.containsKey("pedido") ? payload.get("pedido") : payload;
            Pedido pedido = mapper.convertValue(datosPedido, Pedido.class);
            
            Integer idEmpleado = payload.get("idEmpleado") != null ? 
                                 Integer.valueOf(payload.get("idEmpleado").toString()) : null;

            Pedido guardado = pedidoService.guardar(pedido, idEmpleado);
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
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ➔ NUEVO MÉTODO: Cambiar estado genérico (PUT o PATCH)
    @PutMapping("/{id}/cambiar-estado")
public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
    try {
        String nuevoEstado = payload.get("nuevoEstado") != null ? payload.get("nuevoEstado").toString() : null;
        String observaciones = payload.get("observaciones") != null ? payload.get("observaciones").toString() : "";
        
        // Conversión segura a Integer sin importar si viene como String o Number de JS
        Integer idUsuario = 1; 
        if (payload.get("idUsuario") != null) {
            idUsuario = Double.valueOf(payload.get("idUsuario").toString()).intValue();
        }

        Pedido actualizado = pedidoService.cambiarEstadoPedido(id, nuevoEstado, observaciones, idUsuario);
        return ResponseEntity.ok(actualizado);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error al cambiar estado: " + e.getMessage());
    }
}

    // ➔ NUEVO MÉTODO: Registrar Pago / Entrega de Dinero
    @PostMapping("/{id}/pagos")
    public ResponseEntity<?> registrarPago(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        try {
            Double monto = Double.valueOf(payload.get("monto").toString());
            String tipoPago = (String) payload.get("tipoPago");
            String urlComprobante = (String) payload.get("urlComprobante");

            Pedido actualizado = pedidoService.agregarPago(id, monto, tipoPago, urlComprobante);
            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar el pago: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Integer id) {
        try {
            // Nota: Asegurate de tener este método implementado en tu pedidoService.
            // Si tu servicio devuelve un Optional, podés usar .orElse(null) o manejar el error.
            Pedido pedido = pedidoService.buscarPorId(id); 
            
            if (pedido != null) {
                return ResponseEntity.ok(pedido);
            } else {
                return ResponseEntity.status(404).body("No se encontró el pedido #" + id);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al buscar el pedido: " + e.getMessage());
        }
    }
}