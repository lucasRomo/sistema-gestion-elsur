package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.security.JwtService;
import com.elsur.sistema_gestion.security.LimitadorIntentos;
import jakarta.servlet.http.HttpServletRequest;
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
    private final LimitadorIntentos limitadorIntentos;

    public AccesoController(JwtService jwtService, LimitadorIntentos limitadorIntentos) {
        this.jwtService = jwtService;
        this.limitadorIntentos = limitadorIntentos;
    }

    @PostMapping("/validar")
    public ResponseEntity<?> validar(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String origen = "acceso:" + ipCliente(request);
        limitadorIntentos.verificar(origen);

        String clave = body.get("clave");
        if (clave == null || !claveEsValida(clave)) {
            limitadorIntentos.registrarFallo(origen);
            return ResponseEntity.status(401).body("Clave incorrecta");
        }
        limitadorIntentos.registrarExito(origen);
        return ResponseEntity.ok(Map.of("token", jwtService.generarTokenPorton()));
    }

    // En Render las peticiones llegan a través de su proxy: la IP real del cliente viene en
    // X-Forwarded-For (la primera de la lista).
    private String ipCliente(HttpServletRequest request) {
        String reenviada = request.getHeader("X-Forwarded-For");
        if (reenviada != null && !reenviada.isBlank()) {
            return reenviada.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
