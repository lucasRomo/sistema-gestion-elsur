package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Rol;
import java.util.List;

public interface RolService {
    List<Rol> listarTodos();
    Rol guardar(Rol rol);
    Rol buscarPorId(Integer id);
    void eliminar(Integer id);
}