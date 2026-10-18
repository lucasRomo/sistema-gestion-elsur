package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.repositories.UnidadMedidaRepository;
import com.elsur.sistema_gestion.services.UnidadMedidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class UnidadMedidaServiceImpl implements UnidadMedidaService {

    @Autowired
    private UnidadMedidaRepository unidadMedidaRepository;

    @Override
    public List<UnidadMedida> obtenerTodas() {
        return unidadMedidaRepository.findAll();
    }

    @Override
    public UnidadMedida guardar(UnidadMedida unidadMedida) {
        if (unidadMedida.getNombre() == null || unidadMedida.getNombre().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre de la unidad de medida no puede estar vacío.");
        }

        String nombreFormateado = unidadMedida.getNombre().trim();

        Integer idExcluido = unidadMedida.getIdUnidad() != null ? unidadMedida.getIdUnidad() : -1;
        boolean existe = unidadMedidaRepository.existsByNombreIgnoreCaseAndIdUnidadNot(nombreFormateado, idExcluido);

        if (existe) {
            throw new RecursoDuplicadoException("Ya existe una unidad de medida registrada con el nombre '" + nombreFormateado + "'.");
        }

        unidadMedida.setNombre(nombreFormateado);
        return unidadMedidaRepository.save(unidadMedida);
    }

    @Override
    public void eliminar(Integer id) {
        if (!unidadMedidaRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("No se encontró la unidad de medida con id: " + id);
        }
        try {
            unidadMedidaRepository.deleteById(id);
            unidadMedidaRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictoDeIntegridadException(
                "No se puede eliminar la unidad porque la usan uno o más insumos. Cambiá la unidad de esos insumos antes de eliminarla.");
        }
    }
}
