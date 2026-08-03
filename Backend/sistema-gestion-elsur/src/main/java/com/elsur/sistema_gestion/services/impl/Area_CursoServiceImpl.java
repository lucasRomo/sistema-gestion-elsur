package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;
import com.elsur.sistema_gestion.services.Area_CursoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class Area_CursoServiceImpl implements Area_CursoService {

    @Autowired
    private Area_CursoRepository areaCursoRepository;

    @Override
    public List<Area_Curso> findAll() {
        return areaCursoRepository.findAll();
    }

    @Override
    public Area_Curso save(Area_Curso areaCurso) {
        return areaCursoRepository.save(areaCurso);
    }
}