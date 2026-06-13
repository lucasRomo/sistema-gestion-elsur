package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.repositories.RegistroActividadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registro-actividad")
public class RegistroActividadController {

    @Autowired
    private RegistroActividadRepository registroActividadRepository;

    @GetMapping
    public List<RegistroActividad> getAll() {
        return registroActividadRepository.findAll();
    }

    @PostMapping
    public RegistroActividad create(@RequestBody RegistroActividad registroActividad) {
        return registroActividadRepository.save(registroActividad);
    }

    @GetMapping("/{id}")
    public RegistroActividad getOne(@PathVariable Integer id) { // CORRECCIÓN: Long -> Integer
        return registroActividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de actividad no encontrado"));
    }

    @PutMapping("/{id}")
    public RegistroActividad update(@PathVariable Integer id, @RequestBody RegistroActividad detalles) { // CORRECCIÓN: Long -> Integer
        RegistroActividad registroActividad = registroActividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de actividad no encontrado"));

        registroActividad.setAccion(detalles.getAccion());
        registroActividad.setTablaAfectada(detalles.getTablaAfectada());
        registroActividad.setDatosAnteriores(detalles.getDatosAnteriores());
        registroActividad.setDatosNuevos(detalles.getDatosNuevos());

        return registroActividadRepository.save(registroActividad);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { // CORRECCIÓN: Long -> Integer
        RegistroActividad registroActividad = registroActividadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de actividad no encontrado"));

        registroActividadRepository.delete(registroActividad);
    }
}