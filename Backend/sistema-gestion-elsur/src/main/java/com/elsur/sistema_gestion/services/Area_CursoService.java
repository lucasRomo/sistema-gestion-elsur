package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class Area_CursoService {

    @Autowired
    private Area_CursoRepository area_CursoRepository;

    public List<Area_Curso> findAll() {
        return area_CursoRepository.findAll();
    }

    public Area_Curso save(Area_Curso area_Curso) {
        return area_CursoRepository.save(area_Curso);
    }
}