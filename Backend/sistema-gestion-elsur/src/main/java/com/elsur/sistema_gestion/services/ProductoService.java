package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Producto;
import java.util.List;

public interface ProductoService {
    List<Producto> listarTodos();
    Producto buscarPorId(Integer id);
    Producto guardar(Producto producto, Integer idUsuario);
    void eliminar(Integer id);
    
    void actualizarPreciosMasivo(double porcentaje, Integer idCategoria, Integer idProveedor, List<Integer> idsProductos, String criterio, Integer idUsuario);
}