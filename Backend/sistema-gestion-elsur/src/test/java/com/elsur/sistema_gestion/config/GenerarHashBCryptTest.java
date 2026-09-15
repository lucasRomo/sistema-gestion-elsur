package com.elsur.sistema_gestion.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utilidad de UN SOLO USO para arreglar a mano, por SQL, una fila de "usuario" que
 * quedó con la contraseña en texto plano (de antes de la migración a BCrypt, o
 * creada por un backend desactualizado) -- el caso que tira el WARN "Encoded
 * password does not look like BCrypt" en el login.
 *
 * Ahora imprime DOS valores porque la tabla "usuario" guarda dos cosas distintas:
 * - contrasena: el hash BCrypt que valida el login (irreversible).
 * - contrasena_visible: una copia cifrada con AES (reversible) que usa el botón
 *   "Ver" de Gestión de Usuarios. Si solo arreglás "contrasena", esa fila va a
 *   poder loguearse pero "Ver contraseña" le va a seguir fallando.
 *
 * Uso:
 * 1. Cambiá MI_PASSWORD_NUEVA acá abajo por la contraseña que querés que quede.
 * 2. Corré:  .\mvnw.cmd -Dtest=GenerarHashBCryptTest test
 * 3. Copiá los dos valores que imprime.
 * 4. En el SQL Editor de Supabase, corré (reemplazando usuario/hash/cifrado):
 *
 *    UPDATE usuario SET contrasena = '<HASH_BCRYPT>', contrasena_visible = '<VALOR_CIFRADO>'
 *    WHERE nombre_usuario = 'tu_usuario_aca';
 *
 * 5. Borrá este archivo de test cuando ya no lo necesites más.
 *
 * Tip: en el SQL Editor de Supabase podés chequear qué cuentas están afectadas con:
 *    SELECT id_usuario, nombre_usuario, contrasena FROM usuario
 *    WHERE contrasena NOT LIKE '$2%';
 * (cualquier fila que aparezca ahí tiene la contraseña rota y necesita este mismo arreglo)
 *
 * IMPORTANTE: si cambiaste app.crypto.secret (CRYPTO_SECRET) del valor por defecto,
 * actualizá también SECRETO_CIFRADO acá abajo para que coincida -- si no coinciden,
 * el backend no va a poder desencriptar lo que este test generó.
 */
public class GenerarHashBCryptTest {

    // Tiene que ser el mismo valor que app.crypto.secret en application.properties.
    private static final String SECRETO_CIFRADO = "ElSur_CentroDeCopiado_CryptoKey_2026";

    @Test
    void imprimirHash() {
        String miPasswordNueva = "123123"; // <-- cambiar esto

        String hash = new BCryptPasswordEncoder().encode(miPasswordNueva);
        String cifrado = encriptar(miPasswordNueva);

        System.out.println("HASH GENERADO (contrasena): " + hash);
        System.out.println("VALOR CIFRADO (contrasena_visible): " + cifrado);
    }

    // Copia mínima, sin depender de Spring, del mismo algoritmo que usa
    // CifradoService en el backend (AES/GCM con clave derivada por SHA-256).
    private static String encriptar(String textoPlano) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] claveBytes = sha256.digest(SECRETO_CIFRADO.getBytes(StandardCharsets.UTF_8));
            SecretKeySpec clave = new SecretKeySpec(claveBytes, "AES");

            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, clave, new GCMParameterSpec(128, iv));
            byte[] cifrado = cipher.doFinal(textoPlano.getBytes(StandardCharsets.UTF_8));

            byte[] resultado = new byte[iv.length + cifrado.length];
            System.arraycopy(iv, 0, resultado, 0, iv.length);
            System.arraycopy(cifrado, 0, resultado, iv.length, cifrado.length);

            return Base64.getEncoder().encodeToString(resultado);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo encriptar la contraseña", e);
        }
    }
}
