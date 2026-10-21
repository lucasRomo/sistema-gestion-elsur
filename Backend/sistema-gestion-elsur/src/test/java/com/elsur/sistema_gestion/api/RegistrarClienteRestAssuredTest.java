package com.elsur.sistema_gestion.api;

// ============================================================================================
//  CÓMO LEER ESTE ARCHIVO EN LA PRESENTACIÓN
//  Seguir los comentarios "PASO 1" a "PASO 6" en orden. Cada paso dice qué hace el código y
//  a qué parte de Postman equivale, porque es EXACTAMENTE el mismo caso de prueba.
// ============================================================================================

// --- Imports: las herramientas que usamos ---
// REST Assured: la librería que manda peticiones HTTP y revisa las respuestas (como Postman, pero en código).
import io.restassured.RestAssured;
import io.restassured.config.LogConfig;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
// Hamcrest: la librería de las "comprobaciones" (equalTo = igual a, notNullValue = que exista, etc.).
import org.hamcrest.CustomMatcher;
import org.hamcrest.Matcher;
// JUnit 5: el framework que ejecuta los tests y los marca en verde (pasa) o rojo (falla).
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
// Spring Boot Test: permite levantar nuestro backend real dentro del test.
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

// "given", "equalTo", "notNullValue", etc. se escriben sin prefijo gracias a estos imports estáticos.
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * QUÉ ES ESTE ARCHIVO
 * Una prueba de API escrita en Java con REST Assured y ejecutada con JUnit 5.
 * Prueba el alta de un cliente: POST /api/clientes.
 *
 * Es EXACTAMENTE el mismo caso que la petición "Registrar cliente (POST /api/clientes)" de Postman
 * (docs/ie2/postman): misma URL, mismas cabeceras, mismo body JSON y mismas 10 comprobaciones.
 *
 * CASO DE NEGOCIO: el Dueño de El Sur registra a un cliente habitual con cuenta corriente y un
 * límite de crédito de $15.000 para poder venderle a cuenta.
 *
 * DÓNDE CORRE: el propio test levanta nuestro backend con una base de datos en memoria (H2).
 * No necesita internet, ni tener nada prendido antes, ni toca datos reales.
 *
 * LA IDEA DE REST ASSURED (se lee como una frase):
 *    given()  = "dado que"  -> lo que preparo: cabeceras, token, body JSON
 *    when()   = "cuando"    -> la acción: mando el POST
 *    then()   = "entonces"  -> lo que espero: status, cabeceras, datos del JSON
 */
// PASO 1 — LEVANTAR EL BACKEND
// @SpringBootTest arranca la aplicación completa (controladores, seguridad, base de datos) en un
// puerto libre, como si fuera el servidor de verdad. Por eso en la consola se ve el logo de Spring.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// Perfiles: "test" usa la base H2 en memoria; "api" crea el usuario de prueba admin.api
// (lo hace la clase UsuarioApiPruebaInicializador, que solo existe en los tests).
@ActiveProfiles({"test", "api"})
// Nombre que aparece en el árbol de tests de IntelliJ.
@DisplayName("POST /api/clientes - Registrar cliente (REST Assured)")
class RegistrarClienteRestAssuredTest {

    // Spring elige un puerto libre distinto en cada corrida y lo guarda acá.
    @LocalServerPort
    private int puerto;

    // El token JWT que devuelve el login. Es la "llave" para usar la API: va en la cabecera Authorization.
    private String token;

    // El id del cliente que crea la prueba; lo guardamos para borrarlo al final.
    private Integer idClienteCreado;

    /**
     * PASO 2 — SEGURIDAD: INICIAR SESIÓN Y CONSEGUIR EL TOKEN
     * (en Postman: pestaña Scripts > Pre-request de la petición).
     * @BeforeEach significa que JUnit corre este método ANTES de la prueba. Es preparación, no la prueba.
     */
    @BeforeEach
    void iniciarSesion() {
        // Arranca la configuración de REST Assured de cero.
        RestAssured.reset();

        // Le decimos a REST Assured a qué servidor pegarle: al backend que levantó el test.
        RestAssured.port = puerto;

        // Todas las rutas empiezan con /api (en Postman: {{baseUrl}}/api/...).
        RestAssured.basePath = "/api";

        // Configuración de lo que se muestra en la consola:
        //  - el token aparece oculto como [ BLACKLISTED ] para que no se vea en el proyector;
        //  - si algo falla, se imprime la petición y la respuesta completas para ver el motivo.
        RestAssured.config = RestAssured.config().logConfig(LogConfig.logConfig()
                .blacklistHeader("Authorization")
                .enableLoggingOfRequestAndResponseIfValidationFails(LogDetail.ALL));

        // El login: POST /api/usuarios/login con usuario y contraseña. El backend responde con el token.
        token = given()
                    // Cabecera: lo que mandamos es JSON.
                    .contentType(ContentType.JSON)
                    // Body del login: usuario y contraseña del usuario de prueba admin.api.
                    .body(Map.of("nombreUsuario", UsuarioApiPruebaInicializador.USUARIO,
                                 "password", UsuarioApiPruebaInicializador.PASSWORD))
                .when()
                    .post("/usuarios/login")
                .then()
                    // El login tiene que salir bien (200 OK)...
                    .statusCode(200)
                    // ...y del JSON de respuesta sacamos el campo "token" y lo guardamos.
                    .extract().path("token");
    }

    /**
     * EL CASO DE PRUEBA: registrar un cliente con POST /api/clientes.
     * @Test le dice a JUnit "esto es una prueba": si todas las comprobaciones se cumplen, queda en verde.
     */
    @Test
    @DisplayName("Registrar cliente con cuenta corriente: 201 Created y el JSON del cliente creado")
    void registrarCliente() {
        // Número de documento al azar en cada corrida: así el cliente nunca se repite
        // (si se repitiera, el backend respondería 409 Conflict porque ya existe).
        String documento = String.valueOf(ThreadLocalRandom.current().nextInt(30_000_000, 46_000_000));

        idClienteCreado =
            // PASO 3 — GIVEN ("dado que"): ARMO LA PETICIÓN
            // (en Postman: pestañas Headers y Body)
            given()
                // Cabecera de SEGURIDAD: "Bearer" + el token del login. Sin esto el backend responde 401.
                .header("Authorization", "Bearer " + token)
                // Cabecera Content-Type: el body va en formato JSON.
                .contentType(ContentType.JSON)
                // BODY JSON: los datos del cliente. Map.of arma el JSON {"clave": valor, ...}.
                .body(Map.of(
                        "razonSocial", "Cliente API " + documento,
                        "saldoDeudor", 0,                        // arranca sin deuda
                        "limiteCredito", 15000,                  // puede comprar a cuenta hasta $15.000
                        "estado", "Activo",
                        "personaDeContacto", "Sofía Demo",
                        "condicionDePago", "Cuenta corriente",
                        // Los datos de la persona, con su documento y su dirección.
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
                // Muestra en la consola lo que se manda: método, URL, cabeceras y body.
                .log().method().log().uri().log().headers().log().body()

            // PASO 4 — WHEN ("cuando"): MANDO LA PETICIÓN
            // (en Postman: el botón Send)
            .when()
                .post("/clientes")

            // PASO 5 — THEN ("entonces"): COMPRUEBO LA RESPUESTA
            // (en Postman: pestaña Scripts > Post-response y el resultado en Test Results)
            // Si UNA sola de estas 10 comprobaciones no se cumple, el test queda en rojo y dice cuál falló.
            .then()
                // Muestra en la consola lo que respondió el servidor: estado, cabeceras y JSON.
                .log().status().log().headers().log().body()
                .statusCode(201)                                             // 1. Status 201 Created: se creó un recurso nuevo
                .header("Content-Type", containsString("application/json")) // 2. La respuesta viene en JSON
                .time(lessThan(3000L))                                       // 3. Respondió en menos de 3 segundos
                .body("id_cliente", notNullValue())                          // 4. El backend le asignó un id al cliente
                .body("razonSocial", equalTo("Cliente API " + documento))    // 5. Guardó la razón social que mandamos
                .body("estado", equalTo("Activo"))                           // 6. Quedó activo
                .body("condicionDePago", equalTo("Cuenta corriente"))        // 7. Habilitado para cuenta corriente
                .body("limiteCredito", monto(15000))                         // 8. Con límite de $15.000
                .body("saldoDeudor", monto(0))                               // 9. Sin deuda
                .body("persona.numeroDocumento", equalTo(documento))         // 10. Con el documento que mandamos
                // Del JSON de respuesta sacamos el id del cliente, para borrarlo en el paso 6.
                .extract().path("id_cliente");
    }

    /**
     * PASO 6 — LIMPIEZA: BORRAR EL CLIENTE DE PRUEBA
     * (en Postman: el final del script Post-response).
     * @AfterEach significa que JUnit corre este método DESPUÉS de la prueba. No es parte del caso:
     * solo deja la base como estaba, para poder repetir la prueba las veces que haga falta.
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
     * Comprobación auxiliar para montos de dinero: el backend guarda los importes con 2 decimales,
     * así que el JSON puede traer 15000 o 15000.00. Esta comprobación los toma como iguales.
     * (En Postman se resuelve con Number(...)).
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
