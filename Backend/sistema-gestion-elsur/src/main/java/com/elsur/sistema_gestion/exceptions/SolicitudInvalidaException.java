package com.elsur.sistema_gestion.exceptions;

/**
 * Excepción de negocio genérica para datos de entrada inválidos que no encajan
 * en las otras categorías: un campo obligatorio vacío, una contraseña/usuario/email
 * "actual" que no coincide con el que está en la base, etc.
 * El GlobalExceptionHandler la traduce a HTTP 400.
 */
public class SolicitudInvalidaException extends RuntimeException {

    public SolicitudInvalidaException(String mensaje) {
        super(mensaje);
    }
}
