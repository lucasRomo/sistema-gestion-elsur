package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registro-actividad")
@CrossOrigin(origins = "*") // Permite peticiones desde el React frontend
public class RegistroActividadController {

    @Autowired
    private RegistroActividadService registroActividadService;

    // Obtener historial completo o filtrado por usuario/tabla
    @GetMapping
    public List<RegistroActividad> getAll(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String tabla) {
        
        return registroActividadService.buscarConFiltros(idUsuario, tabla);
    }

    // Obtener un registro específico por ID
    @GetMapping("/{id}")
    public RegistroActividad getOne(@PathVariable Integer id) {
        return registroActividadService.buscarPorId(id);
    }

    // Crear un registro manualmente si hiciera falta vía HTTP (opcional)
    @PostMapping
    public RegistroActividad create(@RequestBody RegistroActividad registroActividad) {
        return registroActividadService.guardar(registroActividad);
    }
}