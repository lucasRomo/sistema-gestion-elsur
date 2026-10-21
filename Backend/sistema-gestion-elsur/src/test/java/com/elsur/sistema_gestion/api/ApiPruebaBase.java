package com.elsur.sistema_gestion.api;

import io.restassured.RestAssured;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.hamcrest.CustomMatcher;
import org.hamcrest.Matcher;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;

/**
 * Base común de las pruebas de API con REST Assured (mismo caso que la colección de Postman en docs/ie2/postman).
 * Por defecto levanta el backend completo en un puerto aleatorio con la base H2 en memoria del perfil "test".
 * Las pruebas que lo permiten (Validación) pueden apuntar a la app publicada con -Dapi.url=https://... y las
 * credenciales en las variables de entorno API_USUARIO y API_PASSWORD (nunca escritas en el código).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles({"test", "api"})
abstract class ApiPruebaBase {

    @LocalServerPort
    private int puerto;

    protected String token;
    protected boolean remoto;
    private Integer idTipoDocumento;
    private Integer idTipoPersona;

    /** Solo la Validación puede correr contra la app publicada; la Verificación siempre es local. */
    protected boolean permiteEntornoPublicado() {
        return false;
    }

    @BeforeEach
    void prepararEntornoEIniciarSesion() {
        String url = System.getProperty("api.url");
        remoto = permiteEntornoPublicado() && url != null && !url.isBlank();
        String usuario = UsuarioApiPruebaInicializador.USUARIO;
        String password = UsuarioApiPruebaInicializador.PASSWORD;

        RestAssured.reset();
        if (remoto) {
            RestAssured.baseURI = url;
            usuario = System.getenv("API_USUARIO");
            password = System.getenv("API_PASSWORD");
            if (usuario == null || password == null) {
                throw new IllegalStateException("Para usar -Dapi.url definí las variables de entorno API_USUARIO y API_PASSWORD");
            }
            idTipoDocumento = 1;
            idTipoPersona = 1;
        } else {
            RestAssured.port = puerto;
            idTipoDocumento = UsuarioApiPruebaInicializador.idTipoDocumento;
            idTipoPersona = UsuarioApiPruebaInicializador.idTipoPersona;
        }
        RestAssured.basePath = "/api";
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails(LogDetail.ALL);

        // Paso previo (igual que en Postman): login para obtener el token JWT
        token = given()
                    .contentType(ContentType.JSON)
                    .body(Map.of("nombreUsuario", usuario, "password", password))
                .when()
                    .post("/usuarios/login")
                .then()
                    .statusCode(200)
                    .body("token", not(emptyOrNullString()))
                    .extract().path("token");
    }

    /** Compara montos sin importar si el JSON trae 15000 o 15000.00 (los importes se guardan con 2 decimales). */
    protected static Matcher<Object> monto(long esperado) {
        return new CustomMatcher<>("un monto igual a " + esperado) {
            @Override
            public boolean matches(Object valor) {
                return valor instanceof Number n && new BigDecimal(n.toString()).compareTo(BigDecimal.valueOf(esperado)) == 0;
            }
        };
    }

    protected static String documentoAleatorio() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(30_000_000, 46_000_000));
    }

    /** Mismo JSON que el body de "Crear cliente" en Postman. */
    protected Map<String, Object> cliente(String documento, int limiteCredito) {
        return Map.of(
                "razonSocial", "Cliente API " + documento,
                "saldoDeudor", 0,
                "limiteCredito", limiteCredito,
                "estado", "Activo",
                "personaDeContacto", "Sofía Demo",
                "condicionDePago", "Cuenta corriente",
                "persona", Map.of(
                        "nombre", "Sofía",
                        "apellido", "Demo",
                        "numeroDocumento", documento,
                        "telefono", "3424000099",
                        "email", "sofia." + documento + "@gestapro.test",
                        "tipoDocumento", Map.of("idTipoDocumento", idTipoDocumento),
                        "tipoPersona", Map.of("idTipoPersona", idTipoPersona),
                        "direccion", Map.of(
                                "calle", "Bv. Pellegrini", "numero", "2350", "codigoPostal", "3000",
                                "ciudad", "Santa Fe", "provincia", "Santa Fe", "pais", "Argentina")));
    }
}
