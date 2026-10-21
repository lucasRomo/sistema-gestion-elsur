package com.elsur.sistema_gestion.api;

import io.restassured.RestAssured;
import io.restassured.config.LogConfig;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import org.hamcrest.CustomMatcher;
import org.hamcrest.Matcher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * El mismo caso de prueba que la petición "Registrar cliente" de Postman (docs/ie2/postman), escrito en Java:
 * POST /api/clientes con el token JWT, el mismo body JSON y las mismas comprobaciones.
 *
 * Por defecto levanta el backend completo en un puerto aleatorio con la base H2 en memoria (perfil "test").
 * Para correrlo contra la app publicada: -Dapi.url=https://sistema-gestion-elsur.onrender.com y las
 * credenciales en las variables de entorno API_USUARIO y API_PASSWORD (nunca escritas en el código).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles({"test", "api"})
@DisplayName("POST /api/clientes - Registrar cliente (REST Assured)")
class RegistrarClienteRestAssuredTest {

    @LocalServerPort
    private int puerto;

    private String token;
    private Integer idClienteCreado;

    /** Preparación (igual que el script de la colección en Postman): login para obtener el token JWT. */
    @BeforeEach
    void iniciarSesion() {
        RestAssured.reset();
        String url = System.getProperty("api.url");
        String usuario = UsuarioApiPruebaInicializador.USUARIO;
        String password = UsuarioApiPruebaInicializador.PASSWORD;
        if (url != null && !url.isBlank()) {
            RestAssured.baseURI = url;
            usuario = System.getenv("API_USUARIO");
            password = System.getenv("API_PASSWORD");
        } else {
            RestAssured.port = puerto;
        }
        RestAssured.basePath = "/api";
        // En la consola el token aparece oculto ([ BLACKLISTED ]): no se muestra en el proyector
        RestAssured.config = RestAssured.config().logConfig(LogConfig.logConfig()
                .blacklistHeader("Authorization")
                .enableLoggingOfRequestAndResponseIfValidationFails(LogDetail.ALL));

        token = given()
                    .contentType(ContentType.JSON)
                    .body(Map.of("nombreUsuario", usuario, "password", password))
                .when()
                    .post("/usuarios/login")
                .then()
                    .statusCode(200)
                    .extract().path("token");
    }

    @Test
    @DisplayName("Registrar cliente con cuenta corriente: 201 Created y el JSON del cliente creado")
    void registrarCliente() {
        String documento = String.valueOf(ThreadLocalRandom.current().nextInt(30_000_000, 46_000_000));

        idClienteCreado =
            given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "razonSocial", "Cliente API " + documento,
                        "saldoDeudor", 0,
                        "limiteCredito", 15000,
                        "estado", "Activo",
                        "personaDeContacto", "Sofía Demo",
                        "condicionDePago", "Cuenta corriente",
                        "persona", Map.of(
                                "nombre", "Sofía",
                                "apellido", "Demo",
                                "numeroDocumento", documento,
                                "telefono", "3424000099",
                                "email", "sofia." + documento + "@gestapro.test",
                                "tipoDocumento", Map.of("idTipoDocumento", 1),
                                "tipoPersona", Map.of("idTipoPersona", 1),
                                "direccion", Map.of(
                                        "calle", "Bv. Pellegrini", "numero", "2350", "codigoPostal", "3000",
                                        "ciudad", "Santa Fe", "provincia", "Santa Fe", "pais", "Argentina"))))
                .log().method().log().uri().log().headers().log().body()
            .when()
                .post("/clientes")
            .then()
                .log().status().log().headers().log().body()
                .statusCode(201)                                      // Status 201 Created
                .header("Content-Type", containsString("application/json")) // Content-Type JSON
                .time(lessThan(3000L))                                // Responde en menos de 3 s
                .body("id_cliente", notNullValue())                   // Tiene id_cliente
                .body("razonSocial", equalTo("Cliente API " + documento))
                .body("estado", equalTo("Activo"))
                .body("condicionDePago", equalTo("Cuenta corriente"))
                .body("limiteCredito", monto(15000))
                .body("saldoDeudor", monto(0))
                .body("persona.numeroDocumento", equalTo(documento))
                .extract().path("id_cliente");
    }

    /** Limpieza (igual que en Postman): borra el cliente de prueba para no dejar datos. */
    @AfterEach
    void borrarClienteDePrueba() {
        if (idClienteCreado != null) {
            given().header("Authorization", "Bearer " + token)
            .when().delete("/clientes/{id}", idClienteCreado)
            .then().statusCode(200);
        }
    }

    /** Compara montos sin importar si el JSON trae 15000 o 15000.00. */
    private static Matcher<Object> monto(long esperado) {
        return new CustomMatcher<>("un monto igual a " + esperado) {
            @Override
            public boolean matches(Object valor) {
                return valor instanceof Number n && new BigDecimal(n.toString()).compareTo(BigDecimal.valueOf(esperado)) == 0;
            }
        };
    }
}
