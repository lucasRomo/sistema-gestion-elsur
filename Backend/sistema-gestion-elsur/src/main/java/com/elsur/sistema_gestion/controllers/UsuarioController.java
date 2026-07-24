package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.elsur.sistema_gestion.services.JwtService;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") 
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtService jwtService; 

    @Autowired
    private EmpleadoRepository EmpleadoRepository;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador) {
        try {
            return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body("Usuario ya Registrado, Intente con uno Nuevo");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(
            @PathVariable Integer id, 
            @RequestBody Usuario usuario,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuarioOperador) {
        usuario.setIdUsuario(id);
        return ResponseEntity.ok(usuarioService.guardar(usuario, idUsuarioOperador));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> cambiarPassword(@PathVariable Integer id, @RequestBody String newPassword) {
        usuarioService.cambiarPassword(id, newPassword);
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
        Optional<Usuario> usuarioOpt = usuarioService.buscarPorNombreUsuario(credenciales.getNombreUsuario());

        if (usuarioOpt.isPresent() && usuarioOpt.get().getPassword().equals(credenciales.getPassword())) {
            Usuario usuario = usuarioOpt.get();
            
            if (usuario.getPersona() != null) {
                Optional<Empleado> empleadoOpt = EmpleadoRepository.findByPersona_IdPersona(usuario.getPersona().getIdPersona());

                if (empleadoOpt.isPresent()) {
                    String estadoEmpleado = empleadoOpt.get().getEstado();

                    if ("Pendiente".equalsIgnoreCase(estadoEmpleado) || "Desactivado".equalsIgnoreCase(estadoEmpleado)) {
                        return ResponseEntity.status(403)
                            .body("Su cuenta se encuentra en un estado que requiere la activación de un administrador.");
                    }
                }
            }

            String token = jwtService.generarToken(usuario);
            
            java.util.Map<String, Object> respuesta = new java.util.HashMap<>();
            respuesta.put("token", token);
            respuesta.put("usuario", usuario);
            
            return ResponseEntity.ok(respuesta);
        } else {
            return ResponseEntity.status(401).body("Credenciales incorrectas");
        }
    }
}