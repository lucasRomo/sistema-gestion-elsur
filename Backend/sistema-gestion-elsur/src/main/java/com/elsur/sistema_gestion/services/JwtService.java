package com.elsur.sistema_gestion.services;

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

    // Antes estaba hardcodeado acá ("ElSur_CentroDeCopiado_SecretKey_2026"), lo que significa
    // que cualquiera con el código fuente (o el repositorio en GitHub) tiene el secreto para
    // firmar tokens válidos. Ahora se lee de application.properties, que a su vez lo toma de
    // la variable de entorno JWT_SECRET si existe (y si no, usa el mismo valor de antes como
    // default de desarrollo). Para producción, definí JWT_SECRET en el entorno y no la subas
    // al repositorio.
    @Value("${app.jwt.secret}")
    private String secretKey;

    // Antes: EXPIRATION_TIME hardcodeado como "private static final long" (10 horas fijas
    // en el código). Igual que el secreto, la duración del token es configuración, no algo
    // que deba requerir recompilar para cambiar -- por ejemplo, para probar qué pasa cuando
    // el token expira (bajarlo a un minuto en desarrollo) no hay que tocar una línea de Java.
    @Value("${app.jwt.expiration-ms}")
    private long expirationTime;

    // Antes: PORTON_EXPIRATION_TIME hardcodeado igual que EXPIRATION_TIME (30 minutos fijos).
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
            // Cualquier otra cosa (token con formato imposible de decodificar, nulo,
            // sin los tres segmentos separados por puntos, etc.): tratarlo como
            // inválido en vez de dejar que la excepción se propague y rompa el
            // filtro -- una petición con un header Authorization roto no debería
            // nunca terminar en un 500.
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
