package com.elsur.sistema_gestion.exceptions;

import java.time.Instant;

public record ApiError(Instant timestamp, int status, String error, String mensaje, String path) {

    public ApiError(int status, String error, String mensaje, String path) {
        this(Instant.now(), status, error, mensaje, path);
    }
}
