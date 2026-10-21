package com.elsur.sistema_gestion.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Datos de la DEMO pública. Al arrancar, Spring carga demo/datos.sql (application-demo.properties);
 * acá se suben a Supabase Storage los archivos de prueba (apuntes, comprobantes, respaldos) y todas
 * las madrugadas se vuelve a cargar todo, así lo que tocan los visitantes no se acumula.
 */
@Component
@Profile("demo")
public class DemoDatos {

    private static final Logger log = LoggerFactory.getLogger(DemoDatos.class);
    private static final String[] BUCKETS = {"archivos-pedidos", "comprobantes", "respaldos"};

    private final DataSource dataSource;
    private final String supabaseUrl;
    private final String claveServicio;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public DemoDatos(DataSource dataSource,
                     @Value("${supabase.url}") String supabaseUrl,
                     @Value("${supabase.service-role-key}") String claveServicio) {
        this.dataSource = dataSource;
        this.supabaseUrl = supabaseUrl;
        this.claveServicio = claveServicio;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void subirArchivosDePrueba() {
        try {
            for (String bucket : BUCKETS) {
                crearBucket(bucket);
            }
            Resource[] archivos = new PathMatchingResourcePatternResolver().getResources("classpath:demo/archivos/*/*");
            int subidos = 0;
            for (Resource archivo : archivos) {
                // .../demo/archivos/<bucket>/<archivo>
                String[] partes = archivo.getURL().getPath().split("/");
                String bucket = partes[partes.length - 2];
                if (subir(bucket, archivo.getFilename(), archivo.getContentAsByteArray())) {
                    subidos++;
                }
            }
            log.info("[DEMO] Archivos de prueba en Supabase Storage: {} de {}", subidos, archivos.length);
        } catch (Exception e) {
            log.warn("[DEMO] No se pudieron subir los archivos de prueba: {}", e.getMessage());
        }
    }

    /** Todas las madrugadas la demo vuelve a los datos de prueba originales, con las fechas al día. */
    @Scheduled(cron = "0 0 5 * * *", zone = "America/Argentina/Buenos_Aires")
    public void reiniciarDatos() {
        new ResourceDatabasePopulator(new ClassPathResource("demo/datos.sql")).execute(dataSource);
        log.info("[DEMO] Datos de prueba recargados.");
    }

    private void crearBucket(String bucket) throws Exception {
        String cuerpo = "{\"id\":\"" + bucket + "\",\"name\":\"" + bucket + "\",\"public\":false}";
        HttpResponse<String> r = http.send(pedido("/storage/v1/bucket")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(cuerpo)).build(), HttpResponse.BodyHandlers.ofString());
        // 200 = creado; si ya existía Supabase responde 400/409 y no hace falta nada más.
        if (r.statusCode() >= 300 && !r.body().toLowerCase().contains("already exists")) {
            log.warn("[DEMO] Bucket {}: {} {}", bucket, r.statusCode(), r.body());
        }
    }

    private boolean subir(String bucket, String nombre, byte[] contenido) throws Exception {
        String tipo = nombre.endsWith(".pdf") ? "application/pdf"
                : nombre.endsWith(".png") ? "image/png"
                : nombre.endsWith(".jpg") || nombre.endsWith(".jpeg") ? "image/jpeg"
                : nombre.endsWith(".json") ? "application/json" : "application/octet-stream";
        HttpResponse<String> r = http.send(pedido("/storage/v1/object/" + bucket + "/" + URLEncoder.encode(nombre, StandardCharsets.UTF_8))
                .header("Content-Type", tipo)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(contenido)).build(), HttpResponse.BodyHandlers.ofString());
        if (r.statusCode() >= 300) {
            log.warn("[DEMO] No se subió {}/{}: {} {}", bucket, nombre, r.statusCode(), r.body());
            return false;
        }
        return true;
    }

    private HttpRequest.Builder pedido(String ruta) {
        return HttpRequest.newBuilder(URI.create(supabaseUrl + ruta))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + claveServicio)
                .header("apikey", claveServicio);
    }
}
