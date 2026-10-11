package com.elsur.sistema_gestion.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;

// El respaldo se arma tabla por tabla (para no llenar la memoria de Render): el archivo tiene
// que seguir siendo un JSON válido con la misma forma que espera la restauración.
@SpringBootTest
@Transactional
class RespaldoGeneracionIntegrationTest {

    @Autowired private RespaldoService respaldoService;
    @MockitoBean private SupabaseStorageService supabaseStorageService;

    @Test
    @DisplayName("Genera un JSON válido con cabecera y una entrada por tabla en \"datos\"")
    void generaJsonValido() throws Exception {
        byte[] bytes = respaldoService.generarRespaldoContingente("Test");

        JsonNode raiz = new ObjectMapper().readTree(bytes);
        assertEquals("El Sur - Centro de Copiado", raiz.get("_sistema").asText());
        assertEquals("Test", raiz.get("_generadoPor").asText());
        JsonNode datos = raiz.get("datos");
        assertTrue(datos.isObject());
        assertTrue(datos.has("Pedido"));
        assertTrue(datos.has("Turno"));
        assertTrue(datos.get("Permiso").isArray());
        assertFalse(datos.has("RespaldoLog"));
        verify(supabaseStorageService).subirBytes(any(), anyString(), anyString(), anyString());
    }
}
