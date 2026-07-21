package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.services.PermisoService;
import com.elsur.sistema_gestion.services.RolService; // ¡NUEVO IMPORT!
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permisos")
@CrossOrigin(origins = "*")
public class PermisoController {

    @Autowired
    private PermisoService permisoService;

    @Autowired
    private RolService rolService; // ¡AGREGAR ESTO!

    @GetMapping
    public List<Permiso> listarTodos() {
        return permisoService.listarTodos();
    }

    @GetMapping("/roles")
    public List<Rol> listarRoles() {
        return permisoService.listarRoles();
    }

    // --- ¡NUEVO ENDPOINT PARA CREAR ROLES! ---
    @PostMapping("/roles")
    public ResponseEntity<Rol> crearRol(@RequestBody Rol nuevoRol) {
        // Guardamos el nuevo rol en la base de datos
        Rol rolGuardado = rolService.guardar(nuevoRol);
        return ResponseEntity.ok(rolGuardado);
    }
    // ------------------------------------------

    @GetMapping("/rol/{idRol}")
    public ResponseEntity<List<Integer>> obtenerPermisosPorRol(@PathVariable Integer idRol) {
        List<Integer> permisosActivos = permisoService.obtenerPermisosPorRol(idRol);
        return ResponseEntity.ok(permisosActivos);
    }

    @PostMapping("/rol/{idRol}/actualizar")
    public ResponseEntity<?> actualizarPermisosRol(@PathVariable Integer idRol, @RequestBody List<Integer> permisosIds) {
        try {
            permisoService.actualizarPermisosRol(idRol, permisosIds);
            return ResponseEntity.ok().body(Map.of("mensaje", "Matriz actualizada correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // --- NUEVO ENDPOINT PARA ELIMINAR ROLES ---
    @DeleteMapping("/roles/{idRol}")
    public ResponseEntity<?> eliminarRol(@PathVariable Integer idRol) {
        try {
            // Protección opcional: No permitir borrar los roles base del sistema (ADMIN y OPERARIO)
            if (idRol == 1 || idRol == 2) {
                return ResponseEntity.status(400).body(Map.of("error", "No se pueden eliminar los roles del sistema por defecto."));
            }
            
            rolService.eliminar(idRol);
            return ResponseEntity.ok(Map.of("mensaje", "Perfil eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "No se puede eliminar el perfil porque está asignado a uno o más usuarios activos."));
        }
    }
}