package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.dto.CompraInsumoDTO;
import com.elsur.sistema_gestion.services.CompraInsumoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compras-insumos")
@RequiredArgsConstructor
public class CompraInsumoController {

    private final CompraInsumoService compraInsumoService;

    @PostMapping
    public ResponseEntity<?> registrarCompraInsumo(@RequestBody CompraInsumoDTO dto) {
        compraInsumoService.registrarCompraInsumo(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
