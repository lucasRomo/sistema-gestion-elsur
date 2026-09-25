package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
        if (institucion.getNombreInstitucion() == null || institucion.getNombreInstitucion().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre de la institución no puede estar vacío.");
        }
        return institucionService.save(institucion);
    }
}