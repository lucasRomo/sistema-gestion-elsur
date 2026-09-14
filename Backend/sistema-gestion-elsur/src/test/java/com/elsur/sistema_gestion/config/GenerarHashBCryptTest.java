package com.elsur.sistema_gestion.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad de UN SOLO USO para generar un hash BCrypt válido y pisar a mano,
 * por SQL, la contraseña de una cuenta que quedó con un valor que no es BCrypt
 * (texto plano de antes de la migración, corrupta, etc.) -- exactamente el caso
 * que tira el WARN "Encoded password does not look like BCrypt" en el login.
 *
 * Uso:
 * 1. Cambiá MI_PASSWORD_NUEVA acá abajo por la contraseña que querés que quede.
 * 2. Corré:  .\mvnw.cmd -Dtest=GenerarHashBCryptTest test
 * 3. Copiá el hash que imprime (arranca con $2a$ o $2b$).
 * 4. En el SQL Editor de Supabase, corré (reemplazando el usuario y el hash):
 *
 *    UPDATE usuario SET contrasena = '<EL_HASH_QUE_IMPRIMIO>'
 *    WHERE nombre_usuario = 'tu_usuario_aca';
 *
 * 5. Borrá este archivo de test, ya cumplió su función.
 *
 * Tip: en el SQL Editor de Supabase podés chequear qué cuentas están afectadas con:
 *    SELECT id_usuario, nombre_usuario, contrasena FROM usuario
 *    WHERE contrasena NOT LIKE '$2%';
 * (cualquier fila que aparezca ahí tiene la contraseña rota y necesita este mismo arreglo)
 */
public class GenerarHashBCryptTest {

    @Test
    void imprimirHash() {
        String miPasswordNueva = "123123"; // <-- cambiar esto

        String hash = new BCryptPasswordEncoder().encode(miPasswordNueva);
        System.out.println("HASH GENERADO: " + hash);
    }
}
