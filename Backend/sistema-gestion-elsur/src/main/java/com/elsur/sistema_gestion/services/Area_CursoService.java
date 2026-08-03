package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Area_Curso;
import java.util.List;

public interface Area_CursoService {
    List<Area_Curso> findAll();
    Area_Curso save(Area_Curso areaCurso);
}