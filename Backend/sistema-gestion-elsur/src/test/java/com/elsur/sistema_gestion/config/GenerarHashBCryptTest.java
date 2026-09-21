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


public class GenerarHashBCryptTest {

    private static final String SECRETO_CIFRADO = "ElSur_CentroDeCopiado_CryptoKey_2026";

    @Test
    void imprimirHash() {
        String miPasswordNueva = "123123"; 

        String hash = new BCryptPasswordEncoder().encode(miPasswordNueva);
        String cifrado = encriptar(miPasswordNueva);

        System.out.println("HASH GENERADO (contrasena): " + hash);
        System.out.println("VALOR CIFRADO (contrasena_visible): " + cifrado);
    }

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
