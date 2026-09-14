package com.elsur.sistema_gestion.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Test aislado (sin contexto de Spring, solo Jackson puro) para la serialización y
 * deserialización JSON de Usuario, en particular del campo "password".
 *
 * Contexto del hallazgo: se había agregado @JsonIgnore sobre "password" para que el
 * hash BCrypt dejara de viajar en las respuestas (login, listar, crear, actualizar).
 * El problema es que @JsonIgnore bloquea el campo en LOS DOS SENTIDOS salvo que se lo
 * pise explícitamente: además de no escribirlo en la respuesta, Jackson deja de LEERLO
 * del JSON de entrada. Eso rompía en silencio el login y el alta de usuarios
 * (UsuarioController.crear / login): el "password" que mandaba el cliente en el body
 * nunca llegaba a setearse en el objeto, y UsuarioServiceImpl.guardar() terminaba
 * llamando a passwordEncoder.encode(null).
 *
 * Se confirmó con un test de deserialización aislado (fuera del proyecto, con Jackson
 * puro) y se corrigió a @JsonProperty(access = Access.WRITE_ONLY), que sí permite leer
 * el campo desde el JSON de entrada pero nunca lo escribe en la respuesta. Este test
 * fija ese comportamiento para que no se vuelva a romper si alguien "arregla" la fuga
 * de contraseña volviendo a @JsonIgnore.
 */
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
        // Así llega el body real de POST /api/usuarios (alta) o POST /api/usuarios/login.
        String jsonEntrante = "{\"nombreUsuario\":\"juan\",\"password\":\"plano123\"}";

        Usuario usuario = mapper.readValue(jsonEntrante, Usuario.class);

        assertEquals("juan", usuario.getNombreUsuario());
        assertEquals("plano123", usuario.getPassword(),
                "Si esto da null, @JsonIgnore volvió a reemplazar a @JsonProperty(WRITE_ONLY): " +
                "el login y el alta se rompen porque el service nunca recibe la contraseña " +
                "que mandó el cliente.");
    }
}
