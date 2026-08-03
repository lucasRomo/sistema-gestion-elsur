package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Institucion;
import java.util.List;

public interface InstitucionService {
    List<Institucion> findAll();
    Institucion save(Institucion institucion);
}