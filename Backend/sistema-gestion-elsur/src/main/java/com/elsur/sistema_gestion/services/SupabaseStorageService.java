package com.elsur.sistema_gestion.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/**
 * Única puerta de entrada/salida a Supabase Storage. Corre exclusivamente
 * en el backend: usa la Service Role Key, que nunca debe viajar al navegador.
 * Los buckets ('comprobantes', 'archivos-pedidos') deben quedar PRIVADOS en
 * el dashboard de Supabase — el acceso pasa siempre por acá, protegido por
 * el JWT + MatrizSeguridadValidator de cada endpoint que la use.
 */
@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /** Sube un archivo y devuelve el path único con el que quedó guardado en el bucket. */
    public String subirArchivo(MultipartFile archivo, String bucket) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }
        try {
            String nombreGuardado = generarNombreUnico(archivo.getOriginalFilename());

            String contentType = StringUtils.hasText(archivo.getContentType())
                    ? archivo.getContentType() : "application/octet-stream";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket + "/" + encodePath(nombreGuardado)))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .header("Content-Type", contentType)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(archivo.getBytes()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return nombreGuardado;
            }
            throw new RuntimeException("Supabase Storage respondió " + response.statusCode() + ": " + response.body());

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al subir archivo a Supabase Storage: " + e.getMessage(), e);
        }
    }

    /** Descarga los bytes de un archivo. Es la única forma de leerlo, ya que el bucket es privado. */
    public byte[] descargarArchivo(String bucket, String path) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket + "/" + encodePath(path)))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200) {
                return response.body();
            }
            throw new RuntimeException("Archivo no encontrado en Supabase Storage (status " + response.statusCode() + ")");

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al descargar archivo de Supabase Storage: " + e.getMessage(), e);
        }
    }

    /** Borra un archivo. Se usa al reemplazar o eliminar un comprobante, para no dejar huérfanos en el bucket. */
    public void eliminarArchivo(String bucket, String path) {
        if (path == null || path.isBlank()) return;
        try {
            String body = "{\"prefixes\":[\"" + path.replace("\"", "\\\"") + "\"]}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .header("Content-Type", "application/json")
                    .method("DELETE", HttpRequest.BodyPublishers.ofString(body))
                    .build();

            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            System.err.println("No se pudo eliminar el archivo de Supabase Storage: " + e.getMessage());
        }
    }

    public String detectarContentType(String nombreArchivo) {
        String ext = nombreArchivo.contains(".")
                ? nombreArchivo.substring(nombreArchivo.lastIndexOf(".") + 1).toLowerCase()
                : "";
        return switch (ext) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "webp" -> "image/webp";
            case "pdf" -> "application/pdf";
            default -> "application/octet-stream";
        };
    }

    private String encodePath(String path) {
        return URLEncoder.encode(path, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public String subirBytes(byte[] contenido, String nombreArchivo, String contentType, String bucket) {
    try {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/storage/v1/object/" + bucket + "/" + encodePath(nombreArchivo)))
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", contentType)
                .POST(HttpRequest.BodyPublishers.ofByteArray(contenido))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return nombreArchivo;
        }
        throw new RuntimeException("Supabase Storage respondió " + response.statusCode() + ": " + response.body());

    } catch (RuntimeException e) {
        throw e;
    } catch (Exception e) {
        throw new RuntimeException("Error al subir respaldo a Supabase Storage: " + e.getMessage(), e);
    }
    }

    /**
     * Genera el mismo esquema de nombre único ("timestamp_uuid.ext") que ya
     * usaba subirArchivo(), pero como método público independiente, para
     * poder generarlo ANTES de subir bytes ya procesados en el backend
     * (ej: un PDF recomprimido) y mantener el mismo formato de nombre en
     * el bucket que el resto de los archivos.
     */
    public String generarNombreUnico(String nombreOriginal) {
        String extension = "";
        if (nombreOriginal != null && nombreOriginal.contains(".")) {
            extension = nombreOriginal.substring(nombreOriginal.lastIndexOf(".") + 1);
        }
        return System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8)
                + (extension.isEmpty() ? "" : "." + extension);
    }
}