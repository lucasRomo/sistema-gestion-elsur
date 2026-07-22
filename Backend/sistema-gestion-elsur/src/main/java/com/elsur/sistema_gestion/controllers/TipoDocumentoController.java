package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.TipoDocumento;
import com.elsur.sistema_gestion.services.TipoDocumentoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-documento")
@CrossOrigin(origins = "*") // Permite la comunicación directa con React
public class TipoDocumentoController {

    private final TipoDocumentoService tipoDocumentoService;

    public TipoDocumentoController(TipoDocumentoService tipoDocumentoService) {
        this.tipoDocumentoService = tipoDocumentoService;
    }

    @GetMapping
    public List<TipoDocumento> obtenerTodos() {
        return tipoDocumentoService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public TipoDocumento obtenerPorId(@PathVariable Integer id) {
        return tipoDocumentoService.obtenerPorId(id);
    }
}