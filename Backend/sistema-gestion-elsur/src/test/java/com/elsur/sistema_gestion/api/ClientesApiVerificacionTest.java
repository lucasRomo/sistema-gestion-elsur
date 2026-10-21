package com.elsur.sistema_gestion.api;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * VERIFICACIÓN ("¿construimos el producto correctamente?"): el endpoint POST /api/clientes cumple su contrato
 * técnico: código de estado, tipo de contenido, estructura del JSON, reglas de validación y seguridad.
 * Siempre corre contra el backend local con H2 (nunca contra la app publicada).
 */
@DisplayName("Verificación - contrato de POST /api/clientes (REST Assured)")
class ClientesApiVerificacionTest extends ApiPruebaBase {

    @Test
    @DisplayName("1. Con token válido: 200 OK y el JSON del cliente creado")
    void crearCliente_conToken_devuelve200() {
        String documento = documentoAleatorio();

        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(cliente(documento, 10000))
            .log().method().log().uri().log().body()
        .when()
            .post("/clientes")
        .then()
            .log().status().log().body()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .time(lessThan(3000L))
            .body("id_cliente", notNullValue())
            .body("razonSocial", equalTo("Cliente API " + documento))
            .body("limiteCredito", monto(10000))
            .body("estado", equalTo("Activo"))
            .body("persona.numeroDocumento", equalTo(documento))
            .body("persona.direccion.ciudad", equalTo("Santa Fe"));
    }

    @Test
    @DisplayName("2. Cliente repetido: 409 Conflict")
    void crearCliente_repetido_devuelve409() {
        String documento = documentoAleatorio();
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(cliente(documento, 0))
                .when().post("/clientes")
                .then().statusCode(200);

        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(cliente(documento, 0))
        .when()
            .post("/clientes")
        .then()
            .log().status().log().body()
            .statusCode(409)
            .body("status", equalTo(409))
            .body("mensaje", containsString("Ya existe"));
    }

    @Test
    @DisplayName("3. Límite de crédito negativo: 400 Bad Request")
    void crearCliente_limiteNegativo_devuelve400() {
        given()
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(cliente(documentoAleatorio(), -500))
        .when()
            .post("/clientes")
        .then()
            .log().status().log().body()
            .statusCode(400)
            .body("mensaje", containsString("no puede ser negativo"));
    }

    @Test
    @DisplayName("4. Sin token: 401 Unauthorized")
    void crearCliente_sinToken_devuelve401() {
        given()
            .contentType(ContentType.JSON)
            .body(cliente(documentoAleatorio(), 0))
        .when()
            .post("/clientes")
        .then()
            .log().status()
            .statusCode(401);
    }
}
