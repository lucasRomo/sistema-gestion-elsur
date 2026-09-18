package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
        // FIX: antes se guardaba sin ninguna validación de backend (solo el frontend
        // exigía el campo con `required`, salteable con una llamada directa a la API).
        // Un nombre vacío/en blanco pasaba silenciosamente, y un nombre duplicado
        // reventaba como DataIntegrityViolationException (restricción unique de la
        // columna) sin capturar, cayendo en el handler genérico del
        // GlobalExceptionHandler y devolviendo un 500 opaco en vez de un mensaje claro.
        if (institucion.getNombreInstitucion() == null || institucion.getNombreInstitucion().isBlank()) {
            throw new SolicitudInvalidaException("El nombre de la institución es obligatorio");
        }
        // FIX: se recorta el nombre ANTES de chequear duplicados y de guardar -- antes
        // se guardaba tal cual llegara (con posibles espacios al inicio/final), lo que
        // podía dejar pasar duplicados "disfrazados" por espacios (ej. "UTN FRSF" y
        // "UTN FRSF " se guardaban como dos institución distintas a pesar de ser, a
        // efectos prácticos, el mismo nombre).
        String nombreNormalizado = institucion.getNombreInstitucion().trim();
        if (institucionRepository.existsByNombreInstitucionIgnoreCase(nombreNormalizado)) {
            throw new RecursoDuplicadoException("Ya existe una institución con ese nombre");
        }
        institucion.setNombreInstitucion(nombreNormalizado);
        return institucionRepository.save(institucion);
    }
}