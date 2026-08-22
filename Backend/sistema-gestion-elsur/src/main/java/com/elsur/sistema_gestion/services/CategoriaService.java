package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.CategoriaProducto;
import java.util.List;

public interface CategoriaService {
    List<CategoriaProducto> listarTodas();
    CategoriaProducto guardar(CategoriaProducto categoria);
    CategoriaProducto buscarPorId(Integer id);
    void eliminar(Integer id);
}