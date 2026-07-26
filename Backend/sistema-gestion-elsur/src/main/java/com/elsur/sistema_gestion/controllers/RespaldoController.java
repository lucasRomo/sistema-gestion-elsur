package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.RespaldoLog;
import com.elsur.sistema_gestion.services.RespaldoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/respaldos")
@CrossOrigin(origins = "*")
public class RespaldoController {

    @Autowired
    private RespaldoService respaldoService;

    @GetMapping("/historial")
    public ResponseEntity<List<RespaldoLog>> obtenerHistorial() {
        return ResponseEntity.ok(respaldoService.obtenerHistorial());
    }

    @GetMapping("/generar")
    public ResponseEntity<byte[]> descargarRespaldoContingente(
            @RequestParam(value = "usuario", required = false, defaultValue = "Operario") String usuario) {
        
        byte[] bytes = respaldoService.generarRespaldoContingente(usuario);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "backup_elsur_contingencia_" + timestamp + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    @GetMapping("/descargar/{id}")
    public ResponseEntity<byte[]> descargarRespaldoExistente(@PathVariable Integer id) {
        byte[] bytes = respaldoService.descargarRespaldoPorId(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"backup_restaurado.json\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRespaldo(@PathVariable Integer id) {
        respaldoService.eliminarRespaldo(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restaurar")
    public ResponseEntity<String> restaurarRespaldo(@RequestParam("archivo") MultipartFile archivo) {
        respaldoService.restaurarRespaldo(archivo);
        return ResponseEntity.ok("Base de datos restaurada correctamente.");
    }
}