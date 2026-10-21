package com.elsur.sistema_gestion.demo;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.security.JwtService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/**
 * Entrada de la DEMO pública de la Muestra: inicia sesión sin portón ni contraseña con una de las
 * cuentas de prueba. Solo existe con el perfil "demo" (en producción esta URL responde 404).
 */
@RestController
@RequestMapping("/api/demo")
@Profile("demo")
public class DemoController {

    /** perfil elegido en la pantalla de entrada → cuenta de prueba y rol que tiene que tener. */
    private static final Map<String, String[]> CUENTAS = Map.of(
            "duenio", new String[]{"dueno.demo", "ADMIN"},
            "empleado", new String[]{"operario.demo", "OPERARIO"});

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final RolRepository rolRepository;
    private final JwtService jwtService;

    public DemoController(UsuarioRepository usuarioRepository, EmpleadoRepository empleadoRepository,
                          RolRepository rolRepository, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.rolRepository = rolRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/entrar")
    @Transactional
    public ResponseEntity<Map<String, Object>> entrar(@RequestBody Map<String, String> pedido) {
        String[] cuenta = CUENTAS.get(pedido.getOrDefault("perfil", ""));
        if (cuenta == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil de demo desconocido.");
        }
        Usuario usuario = usuarioRepository.findByNombreUsuario(cuenta[0])
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "La demo se está preparando. Probá de nuevo en un minuto."));

        // Los visitantes pueden tocar usuarios y roles: antes de entrar, la cuenta vuelve a quedar
        // activa y con su rol, así nadie deja la demo sin poder entrar.
        rolRepository.findByNombreRolIgnoreCase(cuenta[1]).ifPresent(usuario::setRol);
        if (usuario.getPersona() != null) {
            empleadoRepository.findByPersona_IdPersona(usuario.getPersona().getIdPersona())
                    .ifPresent(empleado -> empleado.setEstado("Activo"));
        }
        usuarioRepository.save(usuario);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("token", jwtService.generarToken(usuario));
        respuesta.put("usuario", usuario);
        return ResponseEntity.ok(respuesta);
    }
}
