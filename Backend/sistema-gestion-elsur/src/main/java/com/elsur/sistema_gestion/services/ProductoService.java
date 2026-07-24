package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Producto;
import java.util.List;

public interface ProductoService {
    List<Producto> listarTodos();
    Producto guardar(Producto producto, Integer idUsuario);
    Producto buscarPorId(Integer id); // Agregado
    void eliminar(Integer id); // Agregado
    void actualizarPreciosMasivo(double porcentaje);
    void actualizarPreciosPorCategoria(Integer idCategoria, double porcentaje); // Nuevo: Muy útil
}