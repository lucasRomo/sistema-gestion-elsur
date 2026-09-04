package com.elsur.sistema_gestion.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final MatrizSeguridadValidator matrizSeguridadValidator;

    // Inyectamos el filtro y la matriz por constructor
    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, MatrizSeguridadValidator matrizSeguridadValidator) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.matrizSeguridadValidator = matrizSeguridadValidator;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // El preflight (OPTIONS) de CORS nunca trae el token de autenticación,
                // así que tiene que quedar libre para TODAS las rutas, o el navegador
                // reporta "bloqueado por CORS" en cualquier POST/PUT con JSON hecho
                // desde otro origen (ej: el frontend en :5173 contra el back en :8080).
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/usuarios/login", "/api/login", "/error").permitAll()
                // Pasamos la instancia directamente al método .access()
                .anyRequest().access(matrizSeguridadValidator)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Config global de CORS para todo el backend. Reemplaza a los @CrossOrigin
     * sueltos de cada controller (esos ya no hacen falta, pero no molestan si
     * quedan): acá se centraliza en un solo lugar qué orígenes pueden llamar
     * a la API. Agregá acá el dominio de producción cuando lo tengas.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // "*" en setAllowedOriginPatterns (a diferencia de setAllowedOrigins) SÍ es
        // compatible con allowCredentials(true). Se deja abierto a cualquier origen
        // porque en desarrollo entran tanto localhost como la IP de red local
        // (192.168.x.x) al abrir el sistema desde el celular u otra PC.
        // Antes de pasar a producción, reemplazar por el/los dominios reales.
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}