package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.services.PedidoService;

import tools.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> crearJson(@RequestBody Map<String, Object> payload) {
        return procesarYGuardarPedido(payload, null);
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> crearMultipart(
        @RequestPart("payload") String payloadJson,
        @RequestPart(value = "comprobante", required = false) MultipartFile comprobante
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper(); 
            Map<String, Object> payload = mapper.readValue(payloadJson, Map.class);
            return procesarYGuardarPedido(payload, comprobante);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error al parsear el JSON del pedido: " + e.getMessage());
        }
    }

    @PostMapping(value = "/comprobantes/{idComprobante}/archivo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> vincularArchivoAComprobante(
        @PathVariable Integer idComprobante,
        @RequestPart("comprobante") MultipartFile comprobante
    ) {
        try {
            Pedido pedidoActualizado = pedidoService.asociarArchivoAComprobanteExistente(idComprobante, comprobante);
            return ResponseEntity.ok(pedidoActualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/comprobantes/{idComprobante}/archivo")
    public ResponseEntity<?> eliminarArchivoDeComprobante(@PathVariable Integer idComprobante) {
        try {
            Pedido pedidoActualizado = pedidoService.eliminarArchivoDeComprobante(idComprobante);
            return ResponseEntity.ok(pedidoActualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    private ResponseEntity<?> procesarYGuardarPedido(Map<String, Object> payload, MultipartFile comprobante) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Pedido pedido = mapper.convertValue(payload.get("pedido"), Pedido.class); 
            
            Integer idEmpleado = payload.get("idEmpleado") != null ?  
                                 Integer.valueOf(payload.get("idEmpleado").toString()) : null;
                                 
            Integer idUsuario = payload.get("idUsuario") != null ?
                                Integer.valueOf(payload.get("idUsuario").toString()) : null;

            String tipoPago = payload.get("tipoPago") != null ? 
                              payload.get("tipoPago").toString() : "Efectivo";

            Pedido guardado = pedidoService.guardar(pedido, idEmpleado, idUsuario, tipoPago, comprobante);
            return ResponseEntity.ok(guardado); 
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
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

    @PutMapping("/{id}/cambiar-estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        try {
            String nuevoEstado = payload.get("nuevoEstado") != null ? payload.get("nuevoEstado").toString() : null;
            String observaciones = payload.get("observaciones") != null ? payload.get("observaciones").toString() : "";
            
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

    @PutMapping("/{id}/ubicacion")
    public ResponseEntity<?> actualizarUbicacion(
        @PathVariable Integer id, 
        @RequestBody Map<String, String> payload) {
    
    // Captura el valor enviado desde el frontend o el Map
    String nuevaUbicacion = payload.get("ubicacionEstante");
    if (nuevaUbicacion == null) {
        nuevaUbicacion = payload.get("ubicacion_estante"); // Por si viene con guion bajo desde el JSON
    }

    pedidoService.actualizarUbicacion(id, nuevaUbicacion);
    
    return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/{id}/pagos", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> agregarPago(
        @PathVariable Integer id,
        @RequestPart("payload") String payloadJson,
        @RequestPart(value = "comprobante", required = false) MultipartFile comprobante
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> payload = mapper.readValue(payloadJson, Map.class);

            Double monto = Double.valueOf(payload.get("monto").toString());
            String tipoPago = payload.get("tipoPago").toString();
            Integer idUsuario = null;
            if (payload.get("idUsuario") != null) {
                idUsuario = Double.valueOf(payload.get("idUsuario").toString()).intValue();
            }

            Pedido pedidoActualizado = pedidoService.agregarPagoConArchivo(id, monto, tipoPago, idUsuario, comprobante);
            return ResponseEntity.ok(pedidoActualizado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Integer id) {
        try {
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

    @PutMapping("/{idPedido}/asignar-empleado") 
    public ResponseEntity<?> asignarEmpleado(@PathVariable Integer idPedido, @RequestBody Map<String, String> request) {
        Integer idEmpleado = Integer.parseInt(request.get("idEmpleado"));
        pedidoService.asignarEmpleado(idPedido, idEmpleado); 
        return ResponseEntity.ok().build();
    }
}