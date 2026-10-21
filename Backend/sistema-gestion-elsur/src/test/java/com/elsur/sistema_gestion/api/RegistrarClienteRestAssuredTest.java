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
 * Prueba de API con REST Assured + JUnit 5.
 *
 * Es EXACTAMENTE el mismo caso que la petición "Registrar cliente (POST /api/clientes)" de Postman
 * (docs/ie2/postman): misma URL, mismas cabeceras, mismo body JSON y mismas 10 comprobaciones.
 *
 * Caso de negocio: el Dueño de El Sur registra a un cliente habitual con cuenta corriente y un
 * límite de crédito de $15.000 para poder venderle a cuenta.
 *
 * Dónde corre:
 *  - Por defecto, contra un backend que el propio test levanta (base H2 en memoria, sin tocar datos reales).
 *  - Contra la app publicada, agregando -Dapi.url=https://sistema-gestion-elsur.vercel.app y las
 *    credenciales en las variables de entorno API_USUARIO y API_PASSWORD (nunca escritas en el código).
 *
 * Estructura de REST Assured: given() = lo que preparo, when() = la acción, then() = lo que espero.
 */
// Levanta la aplicación Spring Boot completa en un puerto libre, como si fuera el servidor real.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// Perfil "test": base H2 en memoria. Perfil "api": crea el usuario de prueba admin.api (UsuarioApiPruebaInicializador).
@ActiveProfiles({"test", "api"})
// Nombre que se ve en el árbol de tests de IntelliJ.
@DisplayName("POST /api/clientes - Registrar cliente (REST Assured)")
class RegistrarClienteRestAssuredTest {

    // Puerto que eligió Spring al levantar la app (cambia en cada corrida).
    @LocalServerPort
    private int puerto;

    // Token JWT que devuelve el login: va en la cabecera Authorization del POST.
    private String token;

    // Id del cliente que crea la prueba, para borrarlo al final.
    private Integer idClienteCreado;

    /**
     * SEGURIDAD / PREPARACIÓN (en Postman: pestaña Scripts > Pre-request de la misma petición).
     * JUnit corre este método antes de cada @Test: configura a dónde se le pega y hace el login.
     */
    @BeforeEach
    void iniciarSesion() {
        RestAssured.reset();

        // ¿Contra qué servidor? Si se pasa -Dapi.url, contra la app publicada; si no, contra el backend local del test.
        String url = System.getProperty("api.url");
        String usuario = UsuarioApiPruebaInicializador.USUARIO;      // admin.api (solo existe en test)
        String password = UsuarioApiPruebaInicializador.PASSWORD;
        if (url != null && !url.isBlank()) {
            RestAssured.baseURI = url;
            usuario = System.getenv("API_USUARIO");                // credenciales reales: solo por variables de entorno
            password = System.getenv("API_PASSWORD");
        } else {
            RestAssured.port = puerto;
        }

        // Todas las rutas empiezan con /api (igual que {{baseUrl}}/api/... en Postman).
        RestAssured.basePath = "/api";

        // En la consola el token aparece oculto ([ BLACKLISTED ]) para que no se vea en el proyector;
        // si alguna comprobación falla, se imprime la petición y la respuesta completas para ver el motivo.
        RestAssured.config = RestAssured.config().logConfig(LogConfig.logConfig()
                .blacklistHeader("Authorization")
                .enableLoggingOfRequestAndResponseIfValidationFails(LogDetail.ALL));

        // Login: POST /api/usuarios/login con usuario y contraseña -> devuelve el token JWT.
        token = given()
                    .contentType(ContentType.JSON)                             // cabecera Content-Type: application/json
                    .body(Map.of("nombreUsuario", usuario, "password", password)) // body JSON del login
                .when()
                    .post("/usuarios/login")
                .then()
                    .statusCode(200)                                           // el login tiene que salir bien
                    .extract().path("token");                                  // saca el campo "token" del JSON
    }

    /**
     * EL CASO DE PRUEBA: POST /api/clientes.
     * Mismo request y mismas 10 comprobaciones que la petición de Postman.
     */
    @Test
    @DisplayName("Registrar cliente con cuenta corriente: 201 Created y el JSON del cliente creado")
    void registrarCliente() {
        // DATOS: documento al azar en cada corrida, así el cliente nunca se repite (si no, daría 409).
        String documento = String.valueOf(ThreadLocalRandom.current().nextInt(30_000_000, 46_000_000));

        idClienteCreado =
            // ---------- GIVEN: lo que preparo (pestañas Headers y Body de Postman) ----------
            given()
                .header("Authorization", "Bearer " + token)   // SEGURIDAD: sin este token el backend responde 401
                .contentType(ContentType.JSON)                  // cabecera Content-Type: application/json
                .body(Map.of(                                   // BODY JSON: el cliente con su persona y su dirección
                        "razonSocial", "Cliente API " + documento,
                        "saldoDeudor", 0,
                        "limiteCredito", 15000,                 // cuenta corriente con límite de $15.000
                        "estado", "Activo",
                        "personaDeContacto", "Sofía Demo",
                        "condicionDePago", "Cuenta corriente",
                        "persona", Map.of(
                                "nombre", "Sofía",
                                "apellido", "Demo",
                                "numeroDocumento", documento,
                                "telefono", "3424000099",
                                "email", "sofia." + documento + "@gestapro.test",
                                "tipoDocumento", Map.of("idTipoDocumento", 1),   // 1 = DNI
                                "tipoPersona", Map.of("idTipoPersona", 1),       // 1 = persona física
                                "direccion", Map.of(
                                        "calle", "Bv. Pellegrini", "numero", "2350", "codigoPostal", "3000",
                                        "ciudad", "Santa Fe", "provincia", "Santa Fe", "pais", "Argentina"))))
                // Muestra en la consola el método, la URL, las cabeceras y el body que se envían.
                .log().method().log().uri().log().headers().log().body()

            // ---------- WHEN: la acción (botón Send de Postman) ----------
            .when()
                .post("/clientes")

            // ---------- THEN: lo que espero (pestaña Scripts > Post-response / Test Results de Postman) ----------
            .then()
                // Muestra en la consola el estado, las cabeceras y el JSON que devolvió el servidor.
                .log().status().log().headers().log().body()
                .statusCode(201)                                             // 1. Status 201 Created (se creó un recurso)
                .header("Content-Type", containsString("application/json")) // 2. Responde JSON
                .time(lessThan(3000L))                                       // 3. Responde en menos de 3 segundos
                .body("id_cliente", notNullValue())                          // 4. Trae el id del cliente creado
                .body("razonSocial", equalTo("Cliente API " + documento))    // 5. Razón social enviada
                .body("estado", equalTo("Activo"))                           // 6. Queda activo
                .body("condicionDePago", equalTo("Cuenta corriente"))        // 7. Habilitado para cuenta corriente
                .body("limiteCredito", monto(15000))                         // 8. Límite de $15.000
                .body("saldoDeudor", monto(0))                               // 9. Arranca sin deuda
                .body("persona.numeroDocumento", equalTo(documento))         // 10. Documento enviado
                // Guarda el id para la limpieza.
                .extract().path("id_cliente");
    }

    /**
     * LIMPIEZA (en Postman: final del script Post-response). No es parte de la prueba:
     * JUnit lo corre después de cada @Test y borra el cliente creado para no dejar datos.
     */
    @AfterEach
    void borrarClienteDePrueba() {
        if (idClienteCreado != null) {
            given().header("Authorization", "Bearer " + token)
            .when().delete("/clientes/{id}", idClienteCreado)
            .then().statusCode(200);
        }
    }

    /**
     * Comparador de montos: el backend guarda los importes con 2 decimales, así que el JSON puede traer
     * 15000 o 15000.00. Este matcher los considera iguales (en Postman se resuelve con Number(...)).
     */
    private static Matcher<Object> monto(long esperado) {
        return new CustomMatcher<>("un monto igual a " + esperado) {
            @Override
            public boolean matches(Object valor) {
                return valor instanceof Number n && new BigDecimal(n.toString()).compareTo(BigDecimal.valueOf(esperado)) == 0;
            }
        };
    }
}
