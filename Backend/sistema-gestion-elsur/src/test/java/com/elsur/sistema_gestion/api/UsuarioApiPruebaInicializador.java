package com.elsur.sistema_gestion.api;

import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.TipoDocumento;
import com.elsur.sistema_gestion.models.TipoPersona;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.repositories.TipoDocumentoRepository;
import com.elsur.sistema_gestion.repositories.TipoPersonaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Datos mínimos para las pruebas de API (Postman y REST Assured) sobre la base H2 en memoria:
 * rol ADMIN, tipos de documento/persona y el usuario administrador de prueba.
 * Solo existe en el classpath de test y solo se activa con el perfil "api": nunca corre en producción.
 * (DataInitializer no corre en el perfil "test", por eso se cargan acá.)
 */
@Component
@Profile("api")
public class UsuarioApiPruebaInicializador {

    public static final String USUARIO = "admin.api";
    public static final String PASSWORD = "ApiTest2026";

    /** Ids reales de los tipos cargados (en una base nueva son 1 y 1, como usa la colección de Postman). */
    public static volatile Integer idTipoDocumento;
    public static volatile Integer idTipoPersona;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final TipoPersonaRepository tipoPersonaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioApiPruebaInicializador(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                                         TipoDocumentoRepository tipoDocumentoRepository,
                                         TipoPersonaRepository tipoPersonaRepository,
                                         PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.tipoDocumentoRepository = tipoDocumentoRepository;
        this.tipoPersonaRepository = tipoPersonaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void cargarDatosDePrueba() {
        TipoDocumento dni = tipoDocumentoRepository.findAll().stream()
                .filter(t -> "DNI".equalsIgnoreCase(t.getNombreTipo())).findFirst()
                .orElseGet(() -> {
                    TipoDocumento t = new TipoDocumento();
                    t.setNombreTipo("DNI");
                    return tipoDocumentoRepository.save(t);
                });
        TipoPersona fisica = tipoPersonaRepository.findAll().stream()
                .filter(t -> "Física".equalsIgnoreCase(t.getNombreTipo())).findFirst()
                .orElseGet(() -> {
                    TipoPersona t = new TipoPersona();
                    t.setNombreTipo("Física");
                    return tipoPersonaRepository.save(t);
                });
        idTipoDocumento = dni.getIdTipoDocumento();
        idTipoPersona = fisica.getIdTipoPersona();

        if (usuarioRepository.findByNombreUsuario(USUARIO).isPresent()) {
            return;
        }
        Rol admin = rolRepository.findAll().stream()
                .filter(r -> "ADMIN".equalsIgnoreCase(r.getNombreRol())).findFirst()
                .orElseGet(() -> {
                    Rol r = new Rol();
                    r.setNombreRol("ADMIN");
                    return rolRepository.save(r);
                });

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(USUARIO);
        usuario.setPassword(passwordEncoder.encode(PASSWORD));
        usuario.setRol(admin);
        usuario.setEstado("Activo");
        usuarioRepository.save(usuario);
        System.out.println("[API de prueba] Usuario '" + USUARIO + "' listo para Postman / REST Assured.");
    }
}
