package com.elsur.sistema_gestion.exceptions;

/**
 * Ya existe un recurso con ese valor único (nombre de usuario, email, DNI, etc.).
 * El GlobalExceptionHandler la traduce a HTTP 409 (Conflict).
 */
public class RecursoDuplicadoException extends RuntimeException {

    public RecursoDuplicadoException(String mensaje) {
        super(mensaje);
    }
}
