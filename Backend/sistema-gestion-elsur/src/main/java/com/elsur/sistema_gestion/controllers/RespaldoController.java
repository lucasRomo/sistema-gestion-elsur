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

    @PostMapping("/generar") // O @GetMapping según cómo lo mantengas
    public ResponseEntity<String> generarRespaldo(
        @RequestParam(value = "usuario", required = false, defaultValue = "Operario") String usuario) {
    
    // El servicio guarda el archivo físicamente en la carpeta 'backup' del servidor
    respaldoService.generarRespaldoContingente(usuario);

    return ResponseEntity.ok("Respaldo creado con éxito en el servidor.");
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