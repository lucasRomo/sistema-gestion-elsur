package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.services.MaquinaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maquinas")
@CrossOrigin(origins = "*")
public class MaquinaController {

    @Autowired
    private MaquinaService maquinaService;

    @GetMapping
    public List<Maquina> listar() {
        return maquinaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Maquina> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(maquinaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Maquina> crear(
            @RequestBody Maquina maquina,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(maquinaService.guardar(maquina, idUsuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Maquina> actualizar(
            @PathVariable Integer id,
            @RequestBody Maquina maquina,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        maquina.setIdMaquina(id);
        return ResponseEntity.ok(maquinaService.guardar(maquina, idUsuario));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Maquina> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        String nuevoEstado = body.get("estado");
        return ResponseEntity.ok(maquinaService.cambiarEstado(id, nuevoEstado, idUsuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        maquinaService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}