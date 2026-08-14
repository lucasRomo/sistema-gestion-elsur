package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.repositories.UnidadMedidaRepository;
import com.elsur.sistema_gestion.services.UnidadMedidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
            throw new IllegalArgumentException("El nombre de la unidad de medida no puede estar vacío.");
        }

        String nombreFormateado = unidadMedida.getNombre().trim();

        // Validar si existe una unidad con el mismo nombre (insensible a mayúsculas/minúsculas)
        boolean existe = unidadMedidaRepository.findAll().stream()
                .anyMatch(u -> u.getNombre() != null && u.getNombre().trim().equalsIgnoreCase(nombreFormateado));

        if (existe) {
            throw new IllegalArgumentException("Ya existe una unidad de medida registrada con el nombre '" + nombreFormateado + "'.");
        }

        unidadMedida.setNombre(nombreFormateado);
        return unidadMedidaRepository.save(unidadMedida);
    }

    @Override
    public void eliminar(Integer id) {
        unidadMedidaRepository.deleteById(id);
    }
}