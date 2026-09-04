package com.elsur.sistema_gestion.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.elsur.sistema_gestion.models.Usuario;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET_KEY = "ElSur_CentroDeCopiado_SecretKey_2026";
    private static final long EXPIRATION_TIME = 36_000_000; // 10 horas

    public String generarToken(Usuario usuario) {
        return JWT.create()
                .withSubject(usuario.getNombreUsuario())
                .withClaim("idUsuario", usuario.getIdUsuario())
                .withClaim("rol", usuario.getRol() != null ? usuario.getRol().getNombreRol() : "Empleado")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .sign(Algorithm.HMAC256(SECRET_KEY));
    }

    public boolean esTokenValido(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY);
            JWT.require(algorithm).build().verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    public String obtenerUsername(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getSubject();
    }

    public String obtenerRol(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("rol").asString();
    }

    public Long obtenerIdUsuario(String token) {
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("idUsuario").asLong();
    }
}