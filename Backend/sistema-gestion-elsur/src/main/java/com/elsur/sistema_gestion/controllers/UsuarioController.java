package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Usuario> crear(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.guardar(usuario));
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

    // En UsuarioController.java
@GetMapping("/exists")
public ResponseEntity<Boolean> exists(@RequestParam(required = false) String email, 
                                      @RequestParam(required = false) String dni) {
    if (email != null) {
        return ResponseEntity.ok(usuarioService.emailExiste(email)); // Debes crear este método en tu Service
    }
    if (dni != null) {
        return ResponseEntity.ok(usuarioService.dniExiste(dni)); // Debes crear este método en tu Service
    }
    return ResponseEntity.badRequest().build();
}

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Usuario credenciales) {
    Optional<Usuario> usuario = usuarioService.buscarPorNombreUsuario(credenciales.getNombreUsuario());

    if (usuario.isPresent() && usuario.get().getPassword().equals(credenciales.getPassword())) {
        return ResponseEntity.ok(usuario.get());
    } else {
        return ResponseEntity.status(401).body("Credenciales incorrectas");
    }
}

}