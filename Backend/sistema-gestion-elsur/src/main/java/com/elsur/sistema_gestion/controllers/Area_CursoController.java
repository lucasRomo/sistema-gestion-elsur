package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.services.Area_CursoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas-curso")
@CrossOrigin(origins = "*")
public class Area_CursoController {

    @Autowired
    private Area_CursoService areaCursoService;

    @GetMapping
    public List<Area_Curso> getAll() {
        return areaCursoService.findAll();
    }

    @PostMapping
    public Area_Curso create(@RequestBody Area_Curso areaCurso) {
        return areaCursoService.save(areaCurso);
    }
}