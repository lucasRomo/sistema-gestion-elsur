package com.elsur.sistema_gestion.dto;

import java.util.List;

/**
 * 
 *
 * @param mensaje  
 * @param modulo  
 *                
 *                 
 * @param historial 
 *                 
 *                 
 */
public record PreguntaAsistenteDTO(
        String mensaje,
        String modulo,
        List<MensajeHistorialDTO> historial
) {
    public record MensajeHistorialDTO(String rol, String texto) {
    }
}
