package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.dto.ItemDetectadoDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiIaService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiIaService.class);

    @Value("${google.gemini.api.key}")
    private String apiKey;

    @Value("${google.gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final RestClient restClient = RestClient.builder()
            .requestFactory(buildRequestFactory())
            .build();

    private static JdkClientHttpRequestFactory buildRequestFactory() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return factory;
    }

    public List<ItemDetectadoDTO> analizarComprobante(MultipartFile file, String contextoCatalogos) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = (file.getContentType() != null && !file.getContentType().isEmpty())
                ? file.getContentType()
                : "image/jpeg";

        String promptText = """
            Analiza detenidamente la imagen o documento adjunto (factura, remito, ticket, lista manuscrita o texto libre de compras).

            Aquí tienes nuestro catálogo actual registrado en la Base de Datos para comparar y asociar:
            %s

            --- REGLAS CRÍTICAS DE EXTRACCIÓN Y PARSEO ---

            1. RECONOCIMIENTO FLEXIBLE DE ORDEN Y ESTRUCTURA:
               - Formato A: "Hoja A4 - 23 - $32.000" -> Descripción: Hoja A4 | Cantidad: 23 | Precio: 32000
               - Formato B: "23 - Hoja A4 - $32.000" -> Descripción: Hoja A4 | Cantidad: 23 | Precio: 32000
               - Formato C: "Hoja A4 x23 $32.000"     -> Descripción: Hoja A4 | Cantidad: 23 | Precio: 32000

            2. DESAMBIGUACIÓN ENTRE CANTIDAD Y ESPECIFICACIONES TÉCNICAS:
               - Los números vinculados a modelos, formatos o gramajes ("A4", "75g", "80gr", "100ml", "10x15") son PARTE DE LA DESCRIPCIÓN.
               - La "cantidad" es la cantidad de unidades/bultos/paquetes. Si no se especifica, asigna 1.0.

            3. TRATAMIENTO DE MONEDA Y PRECIO UNITARIO:
               - Elimina símbolos de moneda ($), puntos de millar y normaliza comas decimales a punto.
               - Si el valor corresponde al PRECIO TOTAL: "precioTotalDetectado": total, "precioUnitario": total / cantidad.
               - Si el precio YA es unitario: "precioTotalDetectado": null, "precioUnitario": valor unitario.

            4. REGLA ESTRICTA DE MATCHEO CON LA BASE DE DATOS (NO CREAR NUEVOS):
               - NO inventes ni crees ítems nuevos. Compara de forma estricta contra el catálogo recibido.
               
               - Si coincide claramente con un INSUMO del catálogo:
                 * "tipoItem": "INSUMO"
                 * "idInsumo": ID_DEL_INSUMO
                 * "idProducto": null
                 * "encontradoEnBd": true
                 * "descripcion": Nombre exacto registrado en el catálogo
                 * "advertencia": null

               - Si coincide claramente con un PRODUCTO del catálogo:
                 * "tipoItem": "PRODUCTO"
                 * "idInsumo": null
                 * "idProducto": ID_DEL_PRODUCTO
                 * "encontradoEnBd": true
                 * "descripcion": Nombre exacto registrado en el catálogo
                 * "advertencia": null

               - Si el ítem NO se encuentra registrado en el catálogo de la Base de Datos:
                 * "tipoItem": "INSUMO"
                 * "idInsumo": null
                 * "idProducto": null
                 * "encontradoEnBd": false
                 * "descripcion": Nombre detectado en la imagen
                 * "advertencia": "No se encontró este ítem en la base de datos"

            5. FORMATO DE SALIDA ESTRICTO:
               Devuelve ÚNICAMENTE un arreglo JSON plano de objetos.
               Estructura esperada:
               [
                 {
                   "tipoItem": "INSUMO",
                   "idInsumo": 12,
                   "idProducto": null,
                   "encontradoEnBd": true,
                   "descripcion": "Hoja A4 75g",
                   "cantidad": 1,
                   "precioUnitario": 100,
                   "precioTotalDetectado": null,
                   "advertencia": null
                 }
               ]
            """.formatted(contextoCatalogos != null && !contextoCatalogos.isBlank() ? contextoCatalogos : "[]");

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", promptText),
                    Map.of("inlineData", Map.of(
                        "mimeType", mimeType,
                        "data", base64Image
                    ))
                ))
            ),
            "generationConfig", Map.of(
                "responseMimeType", "application/json"
            )
        );

        String jsonResponse = llamarGeminiConReintentos(requestBody);

        List<ItemDetectadoDTO> listaItems = new ArrayList<>();
        JsonNode rootNode = objectMapper.readTree(jsonResponse);
        JsonNode candidates = rootNode.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {
            String blockReason = rootNode.path("promptFeedback").path("blockReason").asText(null);
            String motivo = blockReason != null ? ("Motivo: " + blockReason) : "Respuesta vacía de Gemini.";
            logger.error("Gemini no devolvió candidatos. {}. Respuesta cruda: {}", motivo, jsonResponse);
            throw new RuntimeException("Gemini no pudo procesar la imagen. " + motivo);
        }

        String contentText = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        contentText = limpiarMarkdownJson(contentText);

        JsonNode itemsArray = objectMapper.readTree(contentText);
        if (itemsArray.isArray()) {
            for (JsonNode itemNode : itemsArray) {
                Long idInsumo = itemNode.path("idInsumo").isNull() ? null : itemNode.path("idInsumo").asLong();
                Long idProducto = itemNode.path("idProducto").isNull() ? null : itemNode.path("idProducto").asLong();
                
                boolean encontradoEnBd = itemNode.path("encontradoEnBd").asBoolean(idInsumo != null || idProducto != null);
                
                String advertencia = itemNode.path("advertencia").isNull() ? null : itemNode.path("advertencia").asText(null);
                if (!encontradoEnBd && (advertencia == null || advertencia.isBlank())) {
                    advertencia = "No se encontró este ítem en la base de datos";
                }

                JsonNode totalNode = itemNode.path("precioTotalDetectado");
                BigDecimal precioTotalDetectado = (totalNode.isMissingNode() || totalNode.isNull())
                        ? null
                        : BigDecimal.valueOf(totalNode.asDouble());

                listaItems.add(new ItemDetectadoDTO(
                    itemNode.path("tipoItem").asText("INSUMO"),
                    idInsumo,
                    idProducto,
                    false, // esNuevoInsumo siempre false
                    encontradoEnBd,
                    itemNode.path("descripcion").asText("Ítem desconocido"),
                    itemNode.path("cantidad").asDouble(1.0),
                    BigDecimal.valueOf(itemNode.path("precioUnitario").asDouble(0.0)),
                    precioTotalDetectado,
                    advertencia
                ));
            }
        }

        return listaItems;
    }

    private String llamarGeminiConReintentos(Map<String, Object> requestBody) {
        final int maxIntentos = 3;
        final long esperaBaseMs = 2000;

        for (int intento = 1; intento <= maxIntentos; intento++) {
            try {
                return restClient.post()
                        .uri(apiUrl + "?key=" + apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);
            } catch (RestClientResponseException e) {
                boolean esSaturacion = e.getStatusCode().value() == 503;
                logger.error("Error devuelto por la API de Gemini (intento {}/{}): HTTP {} - Body: {}",
                        intento, maxIntentos, e.getStatusCode(), e.getResponseBodyAsString());

                if (esSaturacion && intento < maxIntentos) {
                    esperar(esperaBaseMs * intento);
                    continue;
                }

                if (esSaturacion) {
                    throw new RuntimeException("El modelo de Gemini está saturado por alta demanda. Probá de nuevo en unos segundos.", e);
                }
                throw new RuntimeException("Error en Gemini (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
            } catch (org.springframework.web.client.ResourceAccessException e) {
                logger.error("No se pudo conectar con la API de Gemini (intento {}/{}, timeout o red): {}",
                        intento, maxIntentos, e.getMessage());
                if (intento < maxIntentos) {
                    esperar(esperaBaseMs * intento);
                    continue;
                }
                throw new RuntimeException("No se pudo conectar con Gemini (timeout o problema de red). Verificá tu conexión a internet.", e);
            }
        }
        throw new RuntimeException("No se pudo obtener respuesta de Gemini tras " + maxIntentos + " intentos.");
    }

    private void esperar(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrumpido mientras se esperaba para reintentar con Gemini.", ie);
        }
    }

    private String limpiarMarkdownJson(String texto) {
        if (texto == null) return "[]";
        String limpio = texto.trim();
        if (limpio.startsWith("```json")) {
            limpio = limpio.substring(7);
        } else if (limpio.startsWith("```")) {
            limpio = limpio.substring(3);
        }
        if (limpio.endsWith("```")) {
            limpio = limpio.substring(0, limpio.length() - 3);
        }
        return limpio.trim();
    }
}