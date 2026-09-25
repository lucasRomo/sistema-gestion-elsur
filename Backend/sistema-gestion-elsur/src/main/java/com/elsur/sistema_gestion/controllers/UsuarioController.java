package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.CredencialesInvalidasException;
import com.elsur.sistema_gestion.exceptions.CuentaNoHabilitadaException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.dto.VerContrasenaDTO;
import com.elsur.sistema_gestion.services.CifradoService;
import com.elsur.sistema_gestion.services.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.elsur.sistema_gestion.security.JwtService;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private EmpleadoRepository EmpleadoRepository;

    @Autowired
    private CifradoService cifradoService;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador) {
        // El body es un Usuario completo sin restricciones de binding: si no forzáramos el id acá,
        // alguien podría mandar un "idUsuario" de un usuario YA EXISTENTE en el JSON de un POST y
        // usuarioService.guardar() lo tomaría como una actualización (JPA hace upsert por id),
        // pisando los datos (incluido el rol) de ese usuario sin pasar por el chequeo de permisos
        // que sí tiene el PUT de actualizar(). Un alta siempre debe crear un registro nuevo.
        usuario.setIdUsuario(null);
        return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(
            @PathVariable Integer id,
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador,
            Authentication authentication) {
        usuario.setIdUsuario(id);
        usuarioService.validarPermisoParaReasignarRol(usuario, authentication.getName());
        return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
    }


    @PutMapping("/{id}/password")
    public ResponseEntity<?> cambiarPassword(
            @PathVariable Integer id,
            @Valid @RequestBody com.elsur.sistema_gestion.dto.CambioPasswordDTO dto) {


        usuarioService.cambiarPassword(id, dto.getPasswordActual(), dto.getPasswordNueva());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/username")
    public ResponseEntity<?> cambiarNombreUsuario(
            @PathVariable Integer id,
            @RequestBody com.elsur.sistema_gestion.dto.CambioUsuarioDTO dto) {

        if (dto.getUsuarioNuevo() == null || dto.getUsuarioNuevo().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nuevo nombre de usuario no puede estar vacío.");
        }

        usuarioService.cambiarNombreUsuario(id, dto.getUsuarioActual(), dto.getUsuarioNuevo());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/email")
    public ResponseEntity<?> cambiarEmail(
            @PathVariable Integer id,
            @RequestBody com.elsur.sistema_gestion.dto.CambioEmailDTO dto) {

        if (dto.getEmailNuevo() == null || dto.getEmailNuevo().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nuevo correo electrónico no puede estar vacío.");
        }

        usuarioService.cambiarEmail(id, dto.getEmailActual(), dto.getEmailNuevo());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> exists(@RequestParam(required = false) String email,
                                          @RequestParam(required = false) String dni,
                                          @RequestParam(required = false) String nombreUsuario) {
        if (email != null) {
            return ResponseEntity.ok(usuarioService.emailExiste(email));
        }
        if (dni != null) {
            return ResponseEntity.ok(usuarioService.dniExiste(dni));
        }
        if (nombreUsuario != null) {
            return ResponseEntity.ok(usuarioService.usuarioExiste(nombreUsuario));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario credenciales) {
        if (credenciales.getPassword() == null) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

        Usuario usuario;
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(credenciales.getNombreUsuario(), credenciales.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

        usuario = usuarioService.buscarPorNombreUsuario(credenciales.getNombreUsuario())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales incorrectas"));

        if (usuario.getPersona() != null) {
            Optional<Empleado> empleadoOpt = EmpleadoRepository.findByPersona_IdPersona(usuario.getPersona().getIdPersona());

            if (empleadoOpt.isPresent()) {
                String estadoEmpleado = empleadoOpt.get().getEstado();

                if ("Pendiente".equalsIgnoreCase(estadoEmpleado) || "Desactivado".equalsIgnoreCase(estadoEmpleado)) {
                    throw new CuentaNoHabilitadaException(
                            "Su cuenta se encuentra en un estado que requiere la activación de un administrador.");
                }
            }
        }

        String token = jwtService.generarToken(usuario);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("token", token);
        respuesta.put("usuario", usuario);

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/{id}/password-real")
    public ResponseEntity<?> verContrasenaReal(
            @PathVariable Integer id,
            @Valid @RequestBody VerContrasenaDTO dto,
            Authentication authentication) {

        Usuario admin = usuarioService.buscarPorNombreUsuario(authentication.getName())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(dto.getPasswordAdmin(), admin.getPassword())) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

        String rolAdmin = admin.getRol() != null ? admin.getRol().getNombreRol() : "";
        if (!"ADMIN".equalsIgnoreCase(rolAdmin)) {
            throw new AccessDeniedException("Solo un administrador puede ver contraseñas.");
        }

        Usuario objetivo = usuarioService.buscarPorId(id);
        if (objetivo.getContrasenaVisible() == null) {
            throw new RecursoNoEncontradoException(
                "Este usuario no tiene una contraseña visible guardada todavía " +
                "(se creó o se le cambió la clave antes de que existiera esta función). " +
                "Restablecele la contraseña para poder verla de acá en adelante.");
        }

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("passwordReal", cifradoService.desencriptar(objetivo.getContrasenaVisible()));
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/{id}/password-reset")
    public ResponseEntity<?> restablecerPassword(
            @PathVariable Integer id,
            @Valid @RequestBody com.elsur.sistema_gestion.dto.RestablecerPasswordDTO dto,
            Authentication authentication) {

        Usuario admin = usuarioService.buscarPorNombreUsuario(authentication.getName())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(dto.getPasswordAdmin(), admin.getPassword())) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

        String rolAdmin = admin.getRol() != null ? admin.getRol().getNombreRol() : "";
        if (!"ADMIN".equalsIgnoreCase(rolAdmin)) {
            throw new AccessDeniedException("Solo un administrador puede restablecer contraseñas.");
        }

        usuarioService.restablecerPassword(id, dto.getPasswordNueva());
        return ResponseEntity.ok().build();
    }
}
