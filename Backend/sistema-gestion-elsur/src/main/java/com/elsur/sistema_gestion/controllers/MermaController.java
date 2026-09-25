package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Merma;
import com.elsur.sistema_gestion.services.MermaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mermas")
@RequiredArgsConstructor
public class MermaController {

    private final MermaService mermaService;

    @GetMapping
    public ResponseEntity<List<Merma>> obtenerTodas() {
        return ResponseEntity.ok(mermaService.obtenerTodas());
    }

    @PostMapping
    public ResponseEntity<List<Merma>> registrarMermas(@RequestBody List<Merma> mermas) {
        if (mermas == null || mermas.isEmpty()) {
            throw new SolicitudInvalidaException("No se recibió ninguna merma para registrar.");
        }
        for (Merma merma : mermas) {
            if (merma.getCantidad() == null || merma.getCantidad() <= 0) {
                throw new SolicitudInvalidaException(
                    "Cada merma debe tener una cantidad mayor a 0 (se recibió: " + merma.getCantidad() + ").");
            }
            if (merma.getProducto() == null && merma.getInsumo() == null) {
                throw new SolicitudInvalidaException("Cada merma debe estar asociada a un producto o a un insumo.");
            }
        }
        return ResponseEntity.ok(mermaService.registrarMermas(mermas));
    }

    @GetMapping("/pedido/{idPedido}")
    public ResponseEntity<List<Merma>> obtenerMermasPorPedido(@PathVariable Long idPedido) {
        return ResponseEntity.ok(mermaService.obtenerPorPedido(idPedido));
    }
}