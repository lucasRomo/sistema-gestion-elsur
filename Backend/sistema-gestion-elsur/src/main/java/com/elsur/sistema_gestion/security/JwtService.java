package com.elsur.sistema_gestion.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.elsur.sistema_gestion.models.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {


    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms}")
    private long expirationTime;

    @Value("${app.jwt.porton-expiration-ms}")
    private long portonExpirationTime;

    public String generarToken(Usuario usuario) {
        return JWT.create()
                .withSubject(usuario.getNombreUsuario())
                .withClaim("idUsuario", usuario.getIdUsuario())
                .withClaim("rol", usuario.getRol() != null ? usuario.getRol().getNombreRol() : "Empleado")
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + expirationTime))
                .sign(Algorithm.HMAC256(secretKey));
    }

    public boolean esTokenValido(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            JWT.require(algorithm).build().verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        } catch (Exception e) {

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

    public String generarTokenPorton() {
    return JWT.create()
            .withSubject("porton")
            .withClaim("rol", "PORTON")
            .withIssuedAt(new Date())
            .withExpiresAt(new Date(System.currentTimeMillis() + portonExpirationTime))
            .sign(Algorithm.HMAC256(secretKey));
    }
}
