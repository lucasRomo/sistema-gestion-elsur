package com.elsur.sistema_gestion.config;

import org.springframework.beans.factory.annotation.Value;
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
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    // Orígenes del/los front que pueden llamar a la API. Antes era
    // allowedOriginPatterns("*") (cualquier sitio del mundo), ahora es una
    // lista explícita que se define en application.properties
    // (app.cors.allowed-origins), igual que el secreto del JWT. AJUSTAR ese
    // valor con la URL real del front (dev y producción) antes de desplegar,
    // o el navegador va a bloquear las llamadas por CORS.
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    // Además de los orígenes exactos de arriba (que cubren localhost), estos patrones
    // cubren el caso de abrir el front desde la IP de la red local (por ejemplo
    // http://192.168.1.15:5173 desde el celu o la notebook de un compañero conectados
    // al mismo WiFi/router que la compu que corre el backend). Sin esto, el navegador
    // bloquea la petición por CORS aunque el usuario y la contraseña sean correctos,
    // porque el Origin de la petición (la IP) no está en la lista exacta de arriba.
    @Value("${app.cors.allowed-origin-patterns}")
    private List<String> allowedOriginPatterns;

    // Inyectamos el filtro, la matriz y los handlers de error por constructor
    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                           MatrizSeguridadValidator matrizSeguridadValidator,
                           JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                           JwtAccessDeniedHandler jwtAccessDeniedHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.matrizSeguridadValidator = matrizSeguridadValidator;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Sin esto, un 401 (sin token) o un 403 (sin permiso) venían en blanco:
            // acá se responde siempre el mismo JSON de error que usa el resto de la API.
            .exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Antes también estaba acá "/api/login", que no corresponde a ningún
                // controller real (el login vive en "/api/usuarios/login", como el
                // resto de la ruta de usuarios) -- era una regla pública que no hacía
                // nada, pero quedaba como config muerta / confusa. La sacamos.
                .requestMatchers("/api/usuarios/login", "/error", "/api/acceso/validar").permitAll()
                .anyRequest().access(matrizSeguridadValidator)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Antes: setAllowedOriginPatterns(List.of("*")) + allowCredentials(true), es decir,
        // cualquier sitio del mundo podía hacer peticiones autenticadas con cookies/credenciales.
        // Esta API no usa cookies de sesión: el usuario se autentica con
        // "Authorization: Bearer <token>", que el navegador NO adjunta automáticamente como
        // una cookie, así que allowCredentials no hace falta para que el login funcione.
        // Restringimos el origen a los que configuremos explícitamente.
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
