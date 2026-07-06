package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.TipoProveedor;
import java.util.List;

public interface TipoProveedorService {
    List<TipoProveedor> listarTodo();
    TipoProveedor guardar(TipoProveedor tipoProveedor);
    void eliminar(Integer id);
}