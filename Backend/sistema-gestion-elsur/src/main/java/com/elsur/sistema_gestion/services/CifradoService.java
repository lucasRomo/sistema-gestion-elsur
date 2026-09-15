package com.elsur.sistema_gestion.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Cifrado SIMÉTRICO (reversible) de la contraseña en texto plano, guardado en paralelo
 * al hash BCrypt de Usuario.password (que sigue siendo lo único que valida el login).
 * Existe ÚNICAMENTE para la función "Ver contraseña" de Gestión de Usuarios, pedida
 * explícitamente para que un ADMIN pueda verificarla -- a diferencia de un hash, esto
 * SÍ se puede revertir: quien tenga la base de datos Y app.crypto.secret puede recuperar
 * la contraseña real de cualquier usuario. Es una decisión consciente (documentada y
 * aceptada) para poder mostrarla; el endpoint que la usa exige reautenticarse con la
 * contraseña del admin logueado antes de desencriptar nada (ver UsuarioController).
 */
@Service
public class CifradoService {

    @Value("${app.crypto.secret}")
    private String secreto;

    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private SecretKeySpec obtenerClave() {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] claveBytes = sha256.digest(secreto.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(claveBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("No se pudo derivar la clave de cifrado", e);
        }
    }

    public String encriptar(String textoPlano) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, obtenerClave(), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] cifrado = cipher.doFinal(textoPlano.getBytes(StandardCharsets.UTF_8));

            // Guardamos el IV pegado adelante del texto cifrado: hace falta el mismo IV
            // para desencriptar y es seguro viajar junto al resultado (lo que nunca debe
            // viajar ni guardarse junto es la clave, que vive solo en application.properties).
            byte[] resultado = new byte[iv.length + cifrado.length];
            System.arraycopy(iv, 0, resultado, 0, iv.length);
            System.arraycopy(cifrado, 0, resultado, iv.length, cifrado.length);

            return Base64.getEncoder().encodeToString(resultado);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo encriptar la contraseña", e);
        }
    }

    public String desencriptar(String textoCifrado) {
        try {
            byte[] datos = Base64.getDecoder().decode(textoCifrado);

            byte[] iv = new byte[IV_LENGTH_BYTES];
            System.arraycopy(datos, 0, iv, 0, IV_LENGTH_BYTES);

            byte[] cifrado = new byte[datos.length - IV_LENGTH_BYTES];
            System.arraycopy(datos, IV_LENGTH_BYTES, cifrado, 0, cifrado.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, obtenerClave(), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] textoPlano = cipher.doFinal(cifrado);

            return new String(textoPlano, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo desencriptar la contraseña", e);
        }
    }
}
