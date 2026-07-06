package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.services.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RolServiceImpl implements RolService {

    @Autowired
    private RolRepository rolRepository;

    @Override
    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    @Override
    public Rol buscarPorId(Integer id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado con ID: " + id));
    }

    @Override
    @Transactional
    public Rol guardar(Rol rol) {
        return rolRepository.save(rol);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        rolRepository.deleteById(id);
    }
}