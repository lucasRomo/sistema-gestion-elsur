package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.CredencialesInvalidasException;
import com.elsur.sistema_gestion.exceptions.CuentaNoHabilitadaException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.services.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.elsur.sistema_gestion.services.JwtService;
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
    private EmpleadoRepository EmpleadoRepository;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    // Antes tenía un try/catch (RuntimeException e) acá para convertir el "nombre de usuario
    // duplicado" en un 409. Ahora ese caso se resuelve solo: UsuarioServiceImpl lanza
    // RecursoDuplicadoException y el GlobalExceptionHandler arma la respuesta 409.
    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador) {
        return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(
            @PathVariable Integer id,
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador) {
        usuario.setIdUsuario(id);
        return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
    }

    // @Valid activa las anotaciones de CambioPasswordDTO (@NotBlank, @Size):
    // si passwordNueva viene vacía o fuera del rango 8-72, Spring corta acá con un
    // MethodArgumentNotValidException, que el GlobalExceptionHandler traduce a 400
    // con el mensaje de la anotación. Ya no hace falta el chequeo manual de antes.
    @PutMapping("/{id}/password")
    public ResponseEntity<?> cambiarPassword(
            @PathVariable Integer id,
            @Valid @RequestBody com.elsur.sistema_gestion.dto.CambioPasswordDTO dto) {

        // El service exige y valida dto.getPasswordActual() contra el hash guardado
        // (antes ese dato llegaba en el DTO pero no se usaba para nada).
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

    @PostMapping("/prueba-limpia")
    public ResponseEntity<String> pruebaLlimpia(@RequestBody String texto) {
        return ResponseEntity.ok("El POST funciona perfecto: " + texto);
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
        // A propósito, "usuario no existe" y "contraseña incorrecta" tiran la MISMA excepción
        // con el MISMO mensaje: si distinguiéramos, alguien podría usar el login para
        // averiguar qué nombres de usuario existen en el sistema.
        Usuario usuario = usuarioService.buscarPorNombreUsuario(credenciales.getNombreUsuario())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales incorrectas"));

        // Antes: usuario.getPassword().equals(credenciales.getPassword()) -> comparaba texto
        // plano contra texto plano. Ahora compara la contraseña que mandó el usuario contra el
        // hash BCrypt guardado; encoder.matches() se encarga de extraer el salt y recalcular.
        if (!passwordEncoder.matches(credenciales.getPassword(), usuario.getPassword())) {
            throw new CredencialesInvalidasException("Credenciales incorrectas");
        }

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
}
