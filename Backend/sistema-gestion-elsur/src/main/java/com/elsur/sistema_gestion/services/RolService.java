package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Rol;
import java.util.List;

public interface RolService {
    List<Rol> listarTodos();
    Rol guardar(Rol rol);
    Rol buscarPorId(Integer id);
    void eliminar(Integer id);

    // Perfiles "PERFIL_<usuario>" que quedaron sin ningún usuario asignado
    // (por ejemplo, después de reasignar a ese usuario a un rol global distinto).
    // matrizPermisosService.obtenerRoles() los excluye del selector de perfiles
    // globales a propósito, así que sin este método quedaban invisibles y sin
    // ninguna forma de limpiarlos.
    List<Rol> listarPerfilesPersonalizadosHuerfanos();
}