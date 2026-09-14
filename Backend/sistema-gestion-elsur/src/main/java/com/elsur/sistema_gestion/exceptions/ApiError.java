package com.elsur.sistema_gestion.exceptions;

import java.time.Instant;

/**
 * Forma estándar de respuesta de error para toda la API.
 * La devuelve el GlobalExceptionHandler para cualquier excepción no controlada
 * a mano en un controller, y también el JwtAuthenticationEntryPoint (401)
 * y el JwtAccessDeniedHandler (403) para que el front reciba siempre el mismo JSON.
 */
public record ApiError(Instant timestamp, int status, String error, String mensaje, String path) {

    public ApiError(int status, String error, String mensaje, String path) {
        this(Instant.now(), status, error, mensaje, path);
    }
}
