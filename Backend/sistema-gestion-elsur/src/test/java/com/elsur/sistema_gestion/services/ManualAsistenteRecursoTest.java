package com.elsur.sistema_gestion.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

// El asistente responde en base al Manual de Usuario (resources/asistente/manual_usuario.txt).
// Si el archivo se pierde, el asistente sigue andando pero sin manual y sin poder citar
// secciones: este test lo detecta antes de deployar.
class ManualAsistenteRecursoTest {

    @Test
    @DisplayName("El manual del asistente está en el classpath con su índice y su contenido")
    void manualDisponible() throws Exception {
        ClassPathResource recurso = new ClassPathResource("asistente/manual_usuario.txt");
        assertTrue(recurso.exists(), "Falta asistente/manual_usuario.txt");

        String texto;
        try (InputStream in = recurso.getInputStream()) {
            texto = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        assertTrue(texto.startsWith("ÍNDICE DEL MANUAL DE USUARIO"));
        assertTrue(texto.contains("CONTENIDO DEL MANUAL DE USUARIO"));
        assertTrue(texto.contains("8.1. Registrar un pedido formal"));
        assertTrue(texto.contains("11.5. Realizar el arqueo y cierre de turno"));
    }
}
