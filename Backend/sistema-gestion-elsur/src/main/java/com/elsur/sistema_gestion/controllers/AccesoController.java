package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/acceso")
public class AccesoController {

    @Value("${app.clave-acceso}")
    private String claveAcceso;

    private final JwtService jwtService;

    public AccesoController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/validar")
    public ResponseEntity<?> validar(@RequestBody Map<String, String> body) {
        String clave = body.get("clave");
        if (clave == null || !claveAcceso.equals(clave)) {
            return ResponseEntity.status(401).body("Clave incorrecta");
        }
        return ResponseEntity.ok(Map.of("token", jwtService.generarTokenPorton()));
    }
}
