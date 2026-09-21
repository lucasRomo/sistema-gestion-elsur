package com.elsur.sistema_gestion.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;


class UsuarioSerializacionTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void serializar_unUsuarioConPassword_noExponeElPasswordEnElJson() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setNombreUsuario("juan");
        usuario.setPassword("$2a$10$hashBcryptFalsoParaElTest");

        String json = mapper.writeValueAsString(usuario);

        assertFalse(json.contains("password"),
                "El JSON de salida no debe incluir el campo password (fuga de credenciales).");
        assertFalse(json.contains("hashBcryptFalso"),
                "El hash de la contraseña no debe aparecer en ningún lado del JSON de salida.");
    }

    @Test
    void deserializar_unJsonDeAltaOLogin_siCargaElPasswordQueMandaElCliente() throws Exception {
        String jsonEntrante = "{\"nombreUsuario\":\"juan\",\"password\":\"plano123\"}";

        Usuario usuario = mapper.readValue(jsonEntrante, Usuario.class);

        assertEquals("juan", usuario.getNombreUsuario());
        assertEquals("plano123", usuario.getPassword(),
                "Si esto da null, @JsonIgnore volvió a reemplazar a @JsonProperty(WRITE_ONLY): " +
                "el login y el alta se rompen porque el service nunca recibe la contraseña " +
                "que mandó el cliente.");
    }
}
