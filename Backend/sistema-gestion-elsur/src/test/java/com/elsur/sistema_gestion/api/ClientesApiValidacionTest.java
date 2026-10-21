package com.elsur.sistema_gestion.api;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * VALIDACIÓN ("¿construimos el producto correcto?"): el escenario completo de la necesidad del usuario,
 * tomado de los criterios de aceptación de las US GP.26, GP.27, GP.36 y GP.37:
 * "Como Dueño, registro a un cliente habitual con límite de crédito para que pueda comprar a cuenta,
 * lo encuentro en el listado, veo su cuenta corriente en cero y le puedo ajustar el límite".
 * Al final borra el cliente creado, así puede correr también contra la app publicada sin dejar datos:
 *   mvnw test -Dtest=ClientesApiValidacionTest -Dapi.url=https://sistema-gestion-elsur.onrender.com
 *   (con API_USUARIO y API_PASSWORD definidas como variables de entorno)
 */
@DisplayName("Validación - historia de usuario: cliente con cuenta corriente (REST Assured)")
class ClientesApiValidacionTest extends ApiPruebaBase {

    @Override
    protected boolean permiteEntornoPublicado() {
        return true;
    }

    @Test
    @DisplayName("El Dueño registra un cliente con cuenta corriente y queda listo para vender a cuenta")
    void clienteConCuentaCorriente_quedaListoParaVenderACuenta() {
        String documento = documentoAleatorio();
        String autorizacion = "Bearer " + token;

        // 1. Registra al cliente con un límite de crédito de $15.000 (GP.26 / GP.27)
        Integer idCliente =
            given().header("Authorization", autorizacion).contentType(ContentType.JSON)
                   .body(cliente(documento, 15000))
            .when().post("/clientes")
            .then().log().status()
                   .statusCode(200)
                   .extract().path("id_cliente");

        try {
            // 2. Lo encuentra en el listado de clientes, activo y con su límite (GP.26: "queda disponible")
            given().header("Authorization", autorizacion)
            .when().get("/clientes")
            .then().log().status()
                   .statusCode(200)
                   .body("find { it.id_cliente == " + idCliente + " }.razonSocial", equalTo("Cliente API " + documento))
                   .body("find { it.id_cliente == " + idCliente + " }.estado", equalTo("Activo"))
                   .body("find { it.id_cliente == " + idCliente + " }.limiteCredito", monto(15000));

            // 3. Su cuenta corriente arranca en cero y sin movimientos (GP.37)
            given().header("Authorization", autorizacion)
            .when().get("/clientes/{id}", idCliente)
            .then().log().status()
                   .statusCode(200)
                   .body("saldoDeudor", monto(0))
                   .body("condicionDePago", equalTo("Cuenta corriente"));

            given().header("Authorization", autorizacion)
            .when().get("/cuentas-corrientes/cliente/{id}/movimientos", idCliente)
            .then().log().status()
                   .statusCode(200)
                   .body("size()", equalTo(0));

            // 4. Le sube el límite a $20.000 y el cambio se refleja (GP.36)
            given().header("Authorization", autorizacion).contentType(ContentType.JSON)
                   .body(Map.of("limiteCredito", 20000))
            .when().put("/cuentas-corrientes/cliente/{id}/limite", idCliente)
            .then().log().status()
                   .statusCode(200);

            given().header("Authorization", autorizacion)
            .when().get("/clientes/{id}", idCliente)
            .then().log().status().log().body()
                   .statusCode(200)
                   .body("limiteCredito", monto(20000));
        } finally {
            // 5. Limpieza: borra el cliente de prueba (no deja datos, ni en local ni en la app publicada)
            given().header("Authorization", autorizacion)
            .when().delete("/clientes/{id}", idCliente)
            .then().log().status()
                   .statusCode(200);
        }

        given().header("Authorization", autorizacion)
        .when().get("/clientes/{id}", idCliente)
        .then().log().status()
               .statusCode(404);
    }
}
