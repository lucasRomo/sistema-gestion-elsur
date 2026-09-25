package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.services.PedidoService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private SupabaseStorageService supabaseStorageService;

    private ObjectMapper crearObjectMapperConfigurado() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

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
            ObjectMapper mapper = crearObjectMapperConfigurado();
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
        Pedido pedidoActualizado = pedidoService.asociarArchivoAComprobanteExistente(idComprobante, comprobante);
        return ResponseEntity.ok(pedidoActualizado);
    }

    @DeleteMapping("/comprobantes/{idComprobante}/archivo")
    public ResponseEntity<?> eliminarArchivoDeComprobante(@PathVariable Integer idComprobante) {
        Pedido pedidoActualizado = pedidoService.eliminarArchivoDeComprobante(idComprobante);
        return ResponseEntity.ok(pedidoActualizado);
    }

    private ResponseEntity<?> procesarYGuardarPedido(Map<String, Object> payload, MultipartFile comprobante) {
        ObjectMapper mapper = crearObjectMapperConfigurado();
        Pedido pedido = mapper.convertValue(payload.get("pedido"), Pedido.class);

        Integer idEmpleado = payload.get("idEmpleado") != null ?
                             Integer.valueOf(payload.get("idEmpleado").toString()) : null;

        Integer idUsuario = payload.get("idUsuario") != null ?
                            Integer.valueOf(payload.get("idUsuario").toString()) : null;

        String tipoPago = payload.get("tipoPago") != null ?
                          payload.get("tipoPago").toString() : "Efectivo";

        boolean confirmarMaquinaNoDisponible = Boolean.TRUE.equals(payload.get("confirmarMaquinaNoDisponible"));

        Pedido guardado = pedidoService.guardar(pedido, idEmpleado, idUsuario, tipoPago, comprobante,
                confirmarMaquinaNoDisponible);
        return ResponseEntity.ok(guardado);
    }

    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<?> finalizarPedido(@PathVariable Integer id) {
        pedidoService.procesarDescuentoStock(id);
        return ResponseEntity.ok("Pedido #" + id + " finalizado correctamente.");
    }

    @PutMapping("/{id}/cambiar-estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, Object> payload) {
        String nuevoEstado = payload.get("nuevoEstado") != null ? payload.get("nuevoEstado").toString() : null;
        String observaciones = payload.get("observaciones") != null ? payload.get("observaciones").toString() : "";

        // El frontend siempre envía idUsuario (lo toma del usuario logueado) para poder
        // auditar quién hizo el cambio de estado. Se exige acá en vez de defaultear a un
        // usuario fijo, para no atribuirle cambios a un usuario incorrecto.
        if (payload.get("idUsuario") == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que realiza el cambio de estado.");
        }
        Integer idUsuario = Double.valueOf(payload.get("idUsuario").toString()).intValue();

        boolean confirmarMaquinaNoDisponible = Boolean.TRUE.equals(payload.get("confirmarMaquinaNoDisponible"));

        Pedido actualizado = pedidoService.cambiarEstadoPedido(id, nuevoEstado, observaciones, idUsuario,
                confirmarMaquinaNoDisponible);
        return ResponseEntity.ok(actualizado);
    }

    @PutMapping("/{id}/ubicacion")
    public ResponseEntity<?> actualizarUbicacion(
        @PathVariable Integer id,
        @RequestBody Map<String, String> payload) {

        String nuevaUbicacion = payload.get("ubicacionEstante");
        if (nuevaUbicacion == null) {
            nuevaUbicacion = payload.get("ubicacion_estante");
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
        ObjectMapper mapper = crearObjectMapperConfigurado();
        Map<String, Object> payload;
        try {
            payload = mapper.readValue(payloadJson, Map.class);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error al parsear el JSON del pago: " + e.getMessage());
        }

        if (payload.get("monto") == null) {
            throw new SolicitudInvalidaException("Debe indicar el monto del pago.");
        }
        if (payload.get("tipoPago") == null) {
            throw new SolicitudInvalidaException("Debe indicar el tipo de pago.");
        }
        Double monto = Double.valueOf(payload.get("monto").toString());
        String tipoPago = payload.get("tipoPago").toString();
        Integer idUsuario = null;
        if (payload.get("idUsuario") != null) {
            idUsuario = Double.valueOf(payload.get("idUsuario").toString()).intValue();
        }

        Pedido pedidoActualizado = pedidoService.agregarPagoConArchivo(id, monto, tipoPago, idUsuario, comprobante);
        return ResponseEntity.ok(pedidoActualizado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Integer id) {
        Pedido pedido = pedidoService.buscarPorId(id);
        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/comprobantes/archivo/{nombreArchivo:.+}")
    public ResponseEntity<byte[]> verArchivoComprobante(@PathVariable String nombreArchivo) {
    try {
        byte[] datos = supabaseStorageService.descargarArchivo("comprobantes", nombreArchivo);
        String contentType = supabaseStorageService.detectarContentType(nombreArchivo);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + nombreArchivo + "\"")
                .body(datos);
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
    }

    @PutMapping("/{idPedido}/asignar-empleado")
    public ResponseEntity<?> asignarEmpleado(@PathVariable Integer idPedido, @RequestBody Map<String, String> request) {
        if (request.get("idEmpleado") == null) {
            throw new SolicitudInvalidaException("Debe indicar el empleado a asignar.");
        }
        Integer idEmpleado = Integer.parseInt(request.get("idEmpleado"));
        pedidoService.asignarEmpleado(idPedido, idEmpleado);
        return ResponseEntity.ok().build();
    }
}
