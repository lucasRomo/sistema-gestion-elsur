package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.services.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
    public ResponseEntity<?> crear(
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        try {
            return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(
            @PathVariable Integer id,
            @RequestBody Insumo insumo,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        try {
            insumo.setIdInsumo(id);
            return ResponseEntity.ok(insumoService.guardar(insumo, idUsuario));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/convertir")
    public ResponseEntity<?> convertirStock(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        if (payload.get("cantidadBultos") == null) {
            return ResponseEntity.badRequest().body("Debe especificar la cantidad de bultos a abrir.");
        }
        try {
            BigDecimal cantidadBultos = new BigDecimal(payload.get("cantidadBultos").toString());
            Insumo insumoConvertido = insumoService.convertirStock(id, cantidadBultos, idUsuario);
            return ResponseEntity.ok(insumoConvertido);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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