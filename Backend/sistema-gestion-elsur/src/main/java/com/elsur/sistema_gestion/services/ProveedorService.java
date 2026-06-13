package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Proveedor;
import java.util.List;

public interface ProveedorService {
    List<Proveedor> listarTodos();
    Proveedor guardar(Proveedor proveedor);
    void eliminar(Integer id);
}