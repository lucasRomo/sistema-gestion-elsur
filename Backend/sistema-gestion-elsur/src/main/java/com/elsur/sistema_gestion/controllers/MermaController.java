package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Merma;
import com.elsur.sistema_gestion.services.MermaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mermas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MermaController {

    private final MermaService mermaService;

    @GetMapping
    public ResponseEntity<List<Merma>> obtenerTodas() {
        return ResponseEntity.ok(mermaService.obtenerTodas());
    }

    @PostMapping
    public ResponseEntity<List<Merma>> registrarMermas(@RequestBody List<Merma> mermas) {
        return ResponseEntity.ok(mermaService.registrarMermas(mermas));
    }

    @GetMapping("/pedido/{idPedido}")
    public ResponseEntity<List<Merma>> obtenerMermasPorPedido(@PathVariable Long idPedido) {
        return ResponseEntity.ok(mermaService.obtenerPorPedido(idPedido));
    }
}