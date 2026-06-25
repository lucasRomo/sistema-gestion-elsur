package com.elsur.sistema_gestion.config; // Ajustá al paquete real de tu proyecto

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String BASE_URL = "http://localhost:8080/api";

    @Override
    public void run(String... args) throws Exception {
        // Esperamos a que Hibernate levante las tablas
        Thread.sleep(2500);
        
        System.out.println("[DataInitializer] Iniciando verificación de datos maestros...");

        // 1. INICIALIZAR TIPOS DE DOCUMENTO (Si no existen en tu endpoint/DB)
        // Nota: Si tenés repositorios, podés inyectarlos directamente y usar .save(). 
        // Si no, lo hacemos por HTTP POST/SQL directo para asegurar consistencia:
        inicializarMaestro("/tipos-documento", 1, "{\"idTipoDocumento\": 1, \"nombre\": \"DNI\"}");
        inicializarMaestro("/tipos-documento", 2, "{\"idTipoDocumento\": 2, \"nombre\": \"CUIT\"}");
        inicializarMaestro("/tipos-documento", 3, "{\"idTipoDocumento\": 3, \"nombre\": \"CUIL\"}");

        // 2. INICIALIZAR TIPOS DE PERSONA
        inicializarMaestro("/tipos-persona", 1, "{\"idTipoPersona\": 1, \"descripcion\": \"empleado\"}");
        inicializarMaestro("/tipos-persona", 2, "{\"idTipoPersona\": 2, \"descripcion\": \"Cliente\"}");

        // 3. INICIALIZAR ROLES DE USUARIO (Requerido por tu RegisterView idRol: 2)
        inicializarMaestro("/roles", 1, "{\"idRol\": 1, \"nombre\": \"ADMIN\"}");
        inicializarMaestro("/roles", 2, "{\"idRol\": 2, \"nombre\": \"EMPLEADO\"}");

        // 4. CLIENTE CONSUMIDOR FINAL (Tu lógica previa)
        inicializarConsumidorFinal();
    }

    private void inicializarMaestro(String endpoint, int id, String jsonPayload) {
        try {
            URL urlCheck = new URL(BASE_URL + endpoint + "/" + id);
            HttpURLConnection connCheck = (HttpURLConnection) urlCheck.openConnection();
            connCheck.setRequestMethod("GET");
            
            if (connCheck.getResponseCode() == 404) {
                URL urlPost = new URL(BASE_URL + endpoint);
                HttpURLConnection connPost = (HttpURLConnection) urlPost.openConnection();
                connPost.setRequestMethod("POST");
                connPost.setRequestProperty("Content-Type", "application/json");
                connPost.setDoOutput(true);

                try (OutputStream os = connPost.getOutputStream()) {
                    os.write(jsonPayload.getBytes("utf-8"));
                }
                if (connPost.getResponseCode() == 200 || connPost.getResponseCode() == 201) {
                    System.out.println("[DataInitializer] Registrado con éxito en " + endpoint + " ID: " + id);
                }
            }
        } catch (Exception e) {
            System.err.println("[DataInitializer] Error en " + endpoint + ": " + e.getMessage());
        }
    }

    private void inicializarConsumidorFinal() {
        try {
            URL urlCheck = new URL(BASE_URL + "/clientes/1");
            HttpURLConnection connCheck = (HttpURLConnection) urlCheck.openConnection();
            connCheck.setRequestMethod("GET");

            if (connCheck.getResponseCode() == 404) {
                URL urlPost = new URL(BASE_URL + "/clientes");
                HttpURLConnection connPost = (HttpURLConnection) urlPost.openConnection();
                connPost.setRequestMethod("POST");
                connPost.setRequestProperty("Content-Type", "application/json");
                connPost.setDoOutput(true);

                String jsonPayload = "{"
                        + "\"idCliente\": 1,"
                        + "\"razonSocial\": \"Consumidor Final\","
                        + "\"saldoDeudor\": 0.0,"
                        + "\"limiteCredito\": 0.0,"
                        + "\"estado\": \"Activo\","
                        + "\"personaDeContacto\": \"N/A\","
                        + "\"condicionDePago\": \"Contado\","
                        + "\"persona\": {"
                        + "    \"nombre\": \"Consumidor\","
                        + "    \"apellido\": \"Final\","
                        + "    \"numeroDocumento\": \"99999999\","
                        + "    \"tipoDocumento\": { \"idTipoDocumento\": 1 },"
                        + "    \"tipoPersona\": { \"idTipoPersona\": 1 }"
                        + "}"
                        + "}";

                try (OutputStream os = connPost.getOutputStream()) {
                    os.write(jsonPayload.getBytes("utf-8"));
                }
                connPost.getResponseCode();
                System.out.println("[DataInitializer] 'Consumidor Final' inicializado de manera segura.");
            }
        } catch (Exception e) {
            System.err.println("[DataInitializer] Error al crear Consumidor Final: " + e.getMessage());
        }
    }
}