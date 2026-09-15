package com.elsur.sistema_gestion.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

// MOVIDO de config/ a security/ (agrupado con el resto de la infraestructura JWT).
// Sin cambios de comportamiento.
/**
 * Qué responde Spring Security cuando el token SÍ es válido, pero el usuario
 * no tiene permiso para esa ruta/método (MatrizSeguridadValidator devolvió
 * AuthorizationDecision(false)). Sin este componente, Spring devuelve un 403
 * en blanco; acá se arma un JSON 403 consistente con el resto de la API.
 * Se conecta en SecurityConfig con .exceptionHandling(...).accessDeniedHandler(...).
 */
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", Instant.now().toString(),
                "status", 403,
                "error", "Acceso denegado",
                "mensaje", "No tiene permisos para realizar esta operación",
                "path", request.getRequestURI()
        ));
    }
}
