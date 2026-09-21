package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.services.PermisoService;
import com.elsur.sistema_gestion.services.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permisos")
public class PermisoController {

    @Autowired
    private PermisoService permisoService;

    @Autowired
    private RolService rolService;

    @GetMapping
    public List<Permiso> listarTodos() {
        return permisoService.listarTodos();
    }

    @GetMapping("/roles")
    public List<Rol> listarRoles() {
        return permisoService.listarRoles();
    }

    @GetMapping("/roles/huerfanos")
    public List<Rol> listarPerfilesHuerfanos() {
        return rolService.listarPerfilesPersonalizadosHuerfanos();
    }

    @PostMapping("/roles")
    public ResponseEntity<Rol> crearRol(@RequestBody Rol nuevoRol) {
        Rol rolGuardado = rolService.guardar(nuevoRol);
        return ResponseEntity.ok(rolGuardado);
    }

    @GetMapping("/rol/{idRol}")
    public ResponseEntity<List<Integer>> obtenerPermisosPorRol(@PathVariable Integer idRol) {
        List<Integer> permisosActivos = permisoService.obtenerPermisosPorRol(idRol);
        return ResponseEntity.ok(permisosActivos);
    }

    @PostMapping("/rol/{idRol}/actualizar")
    public ResponseEntity<?> actualizarPermisosRol(@PathVariable Integer idRol, @RequestBody List<Integer> permisosIds) {
        permisoService.actualizarPermisosRol(idRol, permisosIds);
        return ResponseEntity.ok().body(Map.of("mensaje", "Matriz actualizada correctamente"));
    }

    @DeleteMapping("/roles/{idRol}")
    public ResponseEntity<?> eliminarRol(@PathVariable Integer idRol) {
        rolService.eliminar(idRol);
        return ResponseEntity.ok(Map.of("mensaje", "Perfil eliminado correctamente"));
    }
}
