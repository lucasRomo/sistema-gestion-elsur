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
@CrossOrigin(origins = "*") // Para que React no tenga problemas de CORS
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Usuario usuario) {
    try {
        return ResponseEntity.ok(usuarioService.guardar(usuario));
    } catch (RuntimeException e) {
        // Atrapa la excepción de UsuarioServiceImpl ("El nombre de usuario ya está en uso")
        // y devuelve status HTTP 409 Conflict con el mensaje explícito
        return ResponseEntity.status(409).body("Usuario ya Registrado, Intente con uno Nuevo");
    }
}

//Esto
@PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(@PathVariable Integer id, @RequestBody Usuario usuario) {
        // Nos aseguramos de que el ID de la URL sea el que se asigne al objeto a guardar
        usuario.setIdUsuario(id);
        return ResponseEntity.ok(usuarioService.guardar(usuario));
    }
//Esto

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> cambiarPassword(@PathVariable Integer id, @RequestBody String newPassword) {
        usuarioService.cambiarPassword(id, newPassword);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/prueba-limpia")
public ResponseEntity<String> pruebaLlimpia(@RequestBody String texto) {
    return ResponseEntity.ok("El POST funciona perfecto: " + texto);
}

    // En UsuarioController.java
@GetMapping("/exists")
public ResponseEntity<Boolean> exists(@RequestParam(required = false) String email, 
                                      @RequestParam(required = false) String dni, 
                                      @RequestParam(required = false) String nombreUsuario) {
    if (email != null) {
        return ResponseEntity.ok(usuarioService.emailExiste(email)); // Debes crear este método en tu Service
    }
    if (dni != null) {
        return ResponseEntity.ok(usuarioService.dniExiste(dni)); // Debes crear este método en tu Service
    }
    if (nombreUsuario != null) {
        return ResponseEntity.ok(usuarioService.usuarioExiste(nombreUsuario)); // 👈 Agregar
    }
    return ResponseEntity.badRequest().build();
}

@Autowired
    private JwtService jwtService; 

@Autowired
    private EmpleadoRepository EmpleadoRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario credenciales) {
    Optional<Usuario> usuarioOpt = usuarioService.buscarPorNombreUsuario(credenciales.getNombreUsuario());

    if (usuarioOpt.isPresent() && usuarioOpt.get().getPassword().equals(credenciales.getPassword())) {
        Usuario usuario = usuarioOpt.get();
        
        // 🛑 VALIDACIÓN DE ESTADOS (Pendiente o Desactivado)
        if (usuario.getPersona() != null) {
            Optional<Empleado> empleadoOpt = EmpleadoRepository.findByPersona_IdPersona(usuario.getPersona().getIdPersona());

            if (empleadoOpt.isPresent()) {
                String estadoEmpleado = empleadoOpt.get().getEstado();

                // Verificamos si es Pendiente O Desactivado
                if ("Pendiente".equalsIgnoreCase(estadoEmpleado) || "Desactivado".equalsIgnoreCase(estadoEmpleado)) {
                    return ResponseEntity.status(403)
                        .body("Su cuenta se encuentra en un estado que requiere la activación de un administrador.");
                }
            }
        }

        // Generar Token JWT y respuesta OK
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