package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.repositories.InstitucionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InstitucionService {

    @Autowired
    private InstitucionRepository institucionRepository;

    public List<Institucion> findAll() {
        return institucionRepository.findAll();
    }

    public Institucion save(Institucion institucion) {
        return institucionRepository.save(institucion);
    }
}