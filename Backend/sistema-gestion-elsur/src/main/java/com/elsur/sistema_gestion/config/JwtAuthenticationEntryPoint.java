package com.elsur.sistema_gestion.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Qué responde Spring Security cuando la petición NO trae un token válido
 * (falta el header, está vencido, la firma no verifica, etc.).
 * Sin este componente, Spring devuelve un 403 en blanco; acá se arma un
 * JSON 401 consistente con el resto de la API (ver ApiError / GlobalExceptionHandler).
 * Se conecta en SecurityConfig con .exceptionHandling(...).authenticationEntryPoint(...).
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", Instant.now().toString(),
                "status", 401,
                "error", "No autenticado",
                "mensaje", "Se requiere un token válido para acceder a este recurso",
                "path", request.getRequestURI()
        ));
    }
}
