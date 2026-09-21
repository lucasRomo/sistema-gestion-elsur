package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registro-actividad")
public class RegistroActividadController {

    @Autowired
    private RegistroActividadService registroActividadService;

    @GetMapping
    public List<RegistroActividad> getAll(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String tabla) {
        
        return registroActividadService.buscarConFiltros(idUsuario, tabla);
    }

    @GetMapping("/{id}")
    public RegistroActividad getOne(@PathVariable Integer id) {
        return registroActividadService.buscarPorId(id);
    }

}