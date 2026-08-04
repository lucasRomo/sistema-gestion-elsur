package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.services.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insumos")
@CrossOrigin(origins = "*")
public class InsumoController {

    @Autowired
    private InsumoService insumoService;

    @GetMapping
    public List<Insumo> listar() {
        return insumoService.listarTodos();
    }

    @GetMapping("/bajo-stock")
    public List<Insumo> listarBajoStock() {
        return insumoService.listarInsumosBajoStock();
    }

    @PostMapping
    public ResponseEntity<Insumo> crear(
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Insumo> actualizar(
            @PathVariable Integer id,
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        insumo.setIdInsumo(id);
        return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
    }

    @PatchMapping("/actualizar-masivo")
        public ResponseEntity<String> actualizarMasivo(
            @RequestBody Map<String, Object> payload,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        
        double porcentaje = payload.get("porcentaje") != null ? Double.parseDouble(payload.get("porcentaje").toString()) : 0.0;
        Integer idProveedor = payload.get("idProveedor") != null ? Integer.parseInt(payload.get("idProveedor").toString()) : null;
        String criterio = payload.get("criterio") != null ? payload.get("criterio").toString() : "TODOS";
        
        @SuppressWarnings("unchecked")
        List<Integer> idsInsumos = (List<Integer>) payload.get("idsInsumos");

        insumoService.actualizarMasivo(porcentaje, idProveedor, idsInsumos, criterio, idUsuario);
        return ResponseEntity.ok("Insumos actualizados correctamente");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        insumoService.eliminar(id);
        return ResponseEntity.ok().build();
    }
}