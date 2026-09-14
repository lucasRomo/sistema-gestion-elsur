package com.elsur.sistema_gestion.exceptions;

/**
 * La operación no se puede completar porque el recurso está referenciado por
 * otros datos (por ejemplo: borrar un rol que todavía tiene usuarios asignados,
 * o un cliente con pedidos cargados). No es lo mismo que "ya existe"
 * (RecursoDuplicadoException): acá el conflicto es con datos relacionados, no
 * con un valor único repetido. El GlobalExceptionHandler la traduce a HTTP 409.
 */
public class ConflictoDeIntegridadException extends RuntimeException {

    public ConflictoDeIntegridadException(String mensaje) {
        super(mensaje);
    }
}
