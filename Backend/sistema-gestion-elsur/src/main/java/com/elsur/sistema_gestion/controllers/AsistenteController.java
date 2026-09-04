package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.dto.PreguntaAsistenteDTO;
import com.elsur.sistema_gestion.dto.RespuestaAsistenteDTO;
import com.elsur.sistema_gestion.services.GeminiAsistenteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/asistente")
@CrossOrigin(origins = "*")
public class AsistenteController {

    private final GeminiAsistenteService geminiAsistenteService;

    public AsistenteController(GeminiAsistenteService geminiAsistenteService) {
        this.geminiAsistenteService = geminiAsistenteService;
    }

    /**
     * Cualquier usuario autenticado puede usar el asistente, sin importar sus
     * permisos de la matriz (ver regla dedicada en MatrizSeguridadValidator):
     * es una guía de uso, no una operación sobre datos sensibles.
     */
    @PostMapping("/preguntar")
    public ResponseEntity<?> preguntar(@RequestBody PreguntaAsistenteDTO pregunta) {
        try {
            if (pregunta.mensaje() == null || pregunta.mensaje().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El mensaje no puede estar vacío"));
            }

            String respuesta = geminiAsistenteService.responder(pregunta);
            return ResponseEntity.ok(new RespuestaAsistenteDTO(respuesta));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "No se pudo responder: " + e.getMessage()));
        }
    }
}
