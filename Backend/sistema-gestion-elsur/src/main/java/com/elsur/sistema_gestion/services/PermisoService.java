package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;

import java.util.List;

public interface PermisoService {
    List<Permiso> listarTodos();
    List<Rol> listarRoles();
    List<Integer> obtenerPermisosPorRol(Integer idRol);
    void actualizarPermisosRol(Integer idRol, List<Integer> permisosIds);
}