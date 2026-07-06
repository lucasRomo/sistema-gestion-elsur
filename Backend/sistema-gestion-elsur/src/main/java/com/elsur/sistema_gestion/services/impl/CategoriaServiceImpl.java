package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Categoria;
import com.elsur.sistema_gestion.repositories.CategoriaRepository;
import com.elsur.sistema_gestion.services.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaServiceImpl implements CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Override
    public List<Categoria> listarTodas() {
        return categoriaRepository.findAll();
    }

    @Override
    @Transactional
    public Categoria guardar(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    @Override
    public Categoria buscarPorId(Integer id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + id));
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        if (categoriaRepository.existsById(id)) {
            categoriaRepository.deleteById(id);
        } else {
            throw new RuntimeException("No se encontró la categoría con ID: " + id);
        }
    }
}