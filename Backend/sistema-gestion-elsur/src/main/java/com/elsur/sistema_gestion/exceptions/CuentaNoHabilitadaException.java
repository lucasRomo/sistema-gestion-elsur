package com.elsur.sistema_gestion.exceptions;


public class CuentaNoHabilitadaException extends RuntimeException {

    public CuentaNoHabilitadaException(String mensaje) {
        super(mensaje);
    }
}
