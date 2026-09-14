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

    // Antes tenía un try/catch (Exception e) que devolvía siempre 500, incluso
    // para errores de validación (ítems vacíos, insumo/producto inexistente,
    // caja cerrada). Ahora CompraInsumoServiceImpl tira SolicitudInvalidaException
    // (400) o RecursoNoEncontradoException (404) según corresponda, y el
    // GlobalExceptionHandler arma la respuesta.
    @PostMapping
    public ResponseEntity<?> registrarCompraInsumo(@RequestBody CompraInsumoDTO dto) {
        compraInsumoService.registrarCompraInsumo(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
