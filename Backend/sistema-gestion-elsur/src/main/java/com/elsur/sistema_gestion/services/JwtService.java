package com.elsur.sistema_gestion.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.elsur.sistema_gestion.models.Usuario;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    // Clave secreta para firmar los tokens de El Sur (idealmente va en application.properties)
    private static final String SECRET_KEY = "ElSur_CentroDeCopiado_SecretKey_2026";
    // El token va a durar 10 horas activo
    private static final long EXPIRATION_TIME = 36_000_000;

    public String generarToken(Usuario usuario) {
        return JWT.create()
                .withSubject(usuario.getNombreUsuario())
                .withClaim("idUsuario", usuario.getIdUsuario())
                // ◄ CAMBIO ACÁ: Usamos getNombreRol() que es el atributo real de tu entidad Rol
                .withClaim("rol", usuario.getRol() != null ? usuario.getRol().getNombreRol() : "Empleado")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(Algorithm.HMAC256(SECRET_KEY));
    }
}