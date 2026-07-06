package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Categoria;
import java.util.List;

public interface CategoriaService {
    List<Categoria> listarTodas();
    Categoria guardar(Categoria categoria);
    Categoria buscarPorId(Integer id);
    void eliminar(Integer id);
}