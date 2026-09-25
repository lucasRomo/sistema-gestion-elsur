package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
        if (clave == null || !claveEsValida(clave)) {
            return ResponseEntity.status(401).body("Clave incorrecta");
        }
        return ResponseEntity.ok(Map.of("token", jwtService.generarTokenPorton()));
    }

    // Este es el único endpoint público (permitAll) del sistema, así que evitamos una comparación
    // de String común (.equals) que corta apenas encuentra el primer caracter distinto: en teoría
    // eso permite medir por tiempo de respuesta cuántos caracteres iniciales acertó un atacante.
    // MessageDigest.isEqual() compara siempre en tiempo constante.
    private boolean claveEsValida(String clave) {
        byte[] esperado = claveAcceso.getBytes(StandardCharsets.UTF_8);
        byte[] recibido = clave.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(esperado, recibido);
    }
}
