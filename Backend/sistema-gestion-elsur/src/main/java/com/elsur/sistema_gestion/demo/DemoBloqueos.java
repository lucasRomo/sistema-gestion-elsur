package com.elsur.sistema_gestion.demo;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * En la DEMO pública se bloquean las acciones que romperían la demo para el siguiente visitante:
 * restaurar o borrar respaldos, tocar contraseñas y cuentas, y cambiar los permisos del Dueño.
 */
@Component
@Profile("demo")
public class DemoBloqueos extends OncePerRequestFilter {

    private static final List<String[]> BLOQUEADOS = List.of(
            new String[]{"POST", "/api/respaldos/restaurar"},
            new String[]{"DELETE", "/api/respaldos/*"},
            new String[]{"PUT", "/api/usuarios/*/password"},
            new String[]{"PUT", "/api/usuarios/*/username"},
            new String[]{"PUT", "/api/usuarios/*/email"},
            new String[]{"POST", "/api/usuarios/*/password-real"},
            new String[]{"POST", "/api/usuarios/*/password-reset"},
            // rol 1 = ADMIN (Dueño) en los datos de prueba
            new String[]{"POST", "/api/permisos/rol/1/actualizar"},
            new String[]{"DELETE", "/api/permisos/roles/1"});

    private final AntPathMatcher rutas = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String ruta = request.getRequestURI();
        for (String[] bloqueo : BLOQUEADOS) {
            if (bloqueo[0].equalsIgnoreCase(request.getMethod()) && rutas.match(bloqueo[1], ruta)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"mensaje\":"
                        + "\"Esta acción está deshabilitada en la demo.\",\"path\":\"" + ruta + "\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
