package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.CategoriaProducto;
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
    public List<CategoriaProducto> listarTodas() {
        return categoriaRepository.findAll();
    }

    @Override
    @Transactional
    public CategoriaProducto guardar(CategoriaProducto categoria) {
        if (categoria.getNombre() == null || categoria.getNombre().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El nombre de la categoría es obligatorio");
        }
        String nombreNormalizado = categoria.getNombre().trim();
        if (categoria.getIdCategoria() == null && categoriaRepository.existsByNombreIgnoreCase(nombreNormalizado)) {
            throw new RecursoDuplicadoException("La categoría '" + nombreNormalizado + "' ya existe.");
        }
        categoria.setNombre(nombreNormalizado);
        return categoriaRepository.save(categoria);
    }

    @Override
    public CategoriaProducto buscarPorId(Integer id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada con id: " + id));
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        if (categoriaRepository.existsById(id)) {
            categoriaRepository.deleteById(id);
        } else {
            throw new RecursoNoEncontradoException("No se encontró la categoría con ID: " + id);
        }
    }
}