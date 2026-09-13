package com.elsur.sistema_gestion.exceptions;

/**
 * Las credenciales son correctas, pero la cuenta todavía no puede operar
 * (empleado "Pendiente" o "Desactivado"). El GlobalExceptionHandler la
 * traduce a HTTP 403.
 */
public class CuentaNoHabilitadaException extends RuntimeException {

    public CuentaNoHabilitadaException(String mensaje) {
        super(mensaje);
    }
}
