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
        return unidadMedidaRepository.save(unidadMedida);
    }

    @Override
    public void eliminar(Integer id) {
        unidadMedidaRepository.deleteById(id);
    }
}