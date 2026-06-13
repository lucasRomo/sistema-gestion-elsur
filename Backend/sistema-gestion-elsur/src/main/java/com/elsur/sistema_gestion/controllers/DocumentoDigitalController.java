package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.services.DocumentoDigitalService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documentos-digital")
public class DocumentoDigitalController {

    @Autowired
    private DocumentoDigitalService documentoDigitalService;

    @GetMapping
    public List<DocumentoDigital> getAll() {
        return documentoDigitalService.findAll();
    }

    @PostMapping
    public DocumentoDigital create(@RequestBody DocumentoDigital documentoDigital) {
        return documentoDigitalService.save(documentoDigital);
    }
}