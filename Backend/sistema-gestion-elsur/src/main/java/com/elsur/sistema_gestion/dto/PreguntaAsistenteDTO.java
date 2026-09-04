package com.elsur.sistema_gestion.dto;

import java.util.List;

/**
 * Pregunta que envía el frontend al asistente de ayuda.
 *
 * @param mensaje  Lo que escribió el usuario.
 * @param modulo   Nombre del módulo/pantalla donde está parado el usuario
 *                 cuando abrió el botón de ayuda (ej: "Compra de Insumos").
 *                 Puede venir null si se abre desde un lugar genérico.
 * @param historial Últimos mensajes previos de la conversación (para que el
 *                  asistente tenga contexto de lo ya hablado). Puede venir
 *                  vacío o null en la primera pregunta.
 */
public record PreguntaAsistenteDTO(
        String mensaje,
        String modulo,
        List<MensajeHistorialDTO> historial
) {
    public record MensajeHistorialDTO(String rol, String texto) {
        // rol esperado: "usuario" o "asistente"
    }
}
