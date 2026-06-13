package com.elsur.sistema_gestion.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Habilitar CORS y deshabilitar CSRF
            .cors(Customizer.withDefaults()) 
            .csrf(csrf -> csrf.disable()) 
            
            .authorizeHttpRequests(auth -> auth
                // Permisos para Clientes y Productos (lo que ya tenías)
                .requestMatchers("/api/clientes/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/productos/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERARIO")
                .requestMatchers("/api/productos-insumos/**").hasAuthority("ROLE_ADMIN")
                
                // 2. Agregamos los nuevos controladores
                .requestMatchers("/api/pedidos/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERARIO")
                .requestMatchers("/api/insumos/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERARIO")
                .requestMatchers("/api/incidencias/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERARIO")
                .requestMatchers("/api/facturas/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/caja/**").hasAuthority("ROLE_ADMIN")
                
                // El resto requiere estar logueado
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Mantenemos texto plano por ahora como pediste, pero recordá cambiarlo a BCryptPasswordEncoder() al final
        return org.springframework.security.crypto.password.NoOpPasswordEncoder.getInstance();
    }

    // 3. Configuración básica de CORS para que React pueda conectar
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:5173")); // Puertos comunes de React/Vite
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}