package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;
import com.elsur.sistema_gestion.repositories.InstitucionRepository;
import com.elsur.sistema_gestion.services.Area_CursoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class Area_CursoServiceImpl implements Area_CursoService {

    @Autowired
    private Area_CursoRepository areaCursoRepository;

    @Autowired
    private InstitucionRepository institucionRepository;

    @Override
    public List<Area_Curso> findAll() {
        return areaCursoRepository.findAll();
    }

    @Override
    public Area_Curso save(Area_Curso areaCurso) {
        if (areaCurso.getNombreArea() == null || areaCurso.getNombreArea().isBlank()) {
            throw new SolicitudInvalidaException("El nombre de la cátedra/área es obligatorio");
        }
        if (areaCurso.getInstitucion() == null || areaCurso.getInstitucion().getIdInstitucion() == null) {
            throw new SolicitudInvalidaException("Debe indicar la institución a la que pertenece la cátedra/área");
        }
        Institucion institucion = institucionRepository.findById(areaCurso.getInstitucion().getIdInstitucion())
                .orElseThrow(() -> new RecursoNoEncontradoException("La institución indicada no existe"));
        areaCurso.setNombreArea(areaCurso.getNombreArea().trim());
        areaCurso.setInstitucion(institucion);
        return areaCursoRepository.save(areaCurso);
    }
}