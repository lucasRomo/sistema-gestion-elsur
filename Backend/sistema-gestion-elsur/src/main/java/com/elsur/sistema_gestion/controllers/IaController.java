package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.dto.ItemDetectadoDTO;
import com.elsur.sistema_gestion.services.GeminiIaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin(origins = "*")
public class IaController {

    private final GeminiIaService geminiIaService;

    public IaController(GeminiIaService geminiIaService) {
        this.geminiIaService = geminiIaService;
    }

    @PostMapping(value = "/analizar-comprobante", consumes = "multipart/form-data")
    public ResponseEntity<?> analizarComprobante(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "catalogos", required = false) String catalogos) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo de imagen no puede estar vacío"));
            }

            List<ItemDetectadoDTO> items = geminiIaService.analizarComprobante(file, catalogos);
            return ResponseEntity.ok(Map.of("items", items));

        } catch (Exception e) {
            e.printStackTrace(); // <--- Muestra en la consola de Spring Boot el error exacto
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al procesar la imagen: " + e.getMessage()));
        }
    }
}