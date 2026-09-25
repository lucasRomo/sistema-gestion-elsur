package com.elsur.sistema_gestion.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Verificar si viene el header con el formato "Bearer <token>"
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (jwtService.esTokenValido(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            String username = jwtService.obtenerUsername(token);
            String rol = jwtService.obtenerRol(token);

            // Un token válido siempre debería traer el claim "rol" (generarToken() lo pone),
            // pero si llegara uno sin ese claim, rol.toUpperCase() tiraría una NullPointerException
            // que este filtro corre ANTES del GlobalExceptionHandler, así que saldría como un
            // error crudo del servlet en vez de una respuesta JSON prolija. Tratamos "sin rol"
            // como token inválido: seguimos la cadena sin autenticar, en vez de romper.
            if (rol == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Creamos la autoridad basada en el rol guardado en el JWT
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + rol.toUpperCase());

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    Collections.singletonList(authority)
            );

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}
