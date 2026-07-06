package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.services.InstitucionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instituciones")
public class InstitucionController {

    @Autowired
    private InstitucionService institucionService;

    @GetMapping
    public List<Institucion> getAll() {
        return institucionService.findAll();
    }

    @PostMapping
    public Institucion create(@RequestBody Institucion institucion) {
        return institucionService.save(institucion);
    }
}