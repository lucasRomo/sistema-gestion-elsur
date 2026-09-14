package com.elsur.sistema_gestion.exceptions;

/**
 * El login falló: el usuario no existe o la contraseña no coincide.
 * A propósito no se distingue cuál de los dos casos fue, para no revelarle
 * a un atacante qué nombres de usuario existen en el sistema.
 * El GlobalExceptionHandler la traduce a HTTP 401.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException(String mensaje) {
        super(mensaje);
    }
}
