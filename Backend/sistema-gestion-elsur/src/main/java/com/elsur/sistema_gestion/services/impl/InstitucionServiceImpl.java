package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.repositories.InstitucionRepository;
import com.elsur.sistema_gestion.services.InstitucionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InstitucionServiceImpl implements InstitucionService {

    @Autowired
    private InstitucionRepository institucionRepository;

    @Override
    public List<Institucion> findAll() {
        return institucionRepository.findAll();
    }

    @Override
    public Institucion save(Institucion institucion) {
        return institucionRepository.save(institucion);
    }
}