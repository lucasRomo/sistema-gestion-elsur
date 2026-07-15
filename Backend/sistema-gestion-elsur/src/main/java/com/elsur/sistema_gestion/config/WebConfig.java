package com.elsur.sistema_gestion.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Obtenemos la ruta absoluta de la carpeta "uploads" en la raíz del proyecto
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();
        
        // Mapeamos la URL http://localhost:8080/uploads/** a la carpeta física del disco
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}