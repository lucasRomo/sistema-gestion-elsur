package com.elsur.sistema_gestion.exceptions;

/**
 * El recurso pedido (usuario, pedido, producto, etc.) no existe.
 * El GlobalExceptionHandler la traduce a HTTP 404.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
