package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.services.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidencias")
@CrossOrigin(origins = "*")
public class IncidenciaController {

    @Autowired
    private IncidenciaService incidenciaService;

    @GetMapping
    public List<Incidencia> listar() {
        return incidenciaService.listarTodas();
    }

    @PostMapping
    public Incidencia reportar(@RequestBody Incidencia incidencia) {
        return incidenciaService.registrar(incidencia);
    }

    @PutMapping("/{id}/resolver")
    public void resolver(@PathVariable Integer id, @RequestBody String resolucion) {
        incidenciaService.resolverIncidencia(id, resolucion);
    }
}