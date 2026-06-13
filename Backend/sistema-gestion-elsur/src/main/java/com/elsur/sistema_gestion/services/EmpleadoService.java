package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Empleado;
import java.util.List;

public interface EmpleadoService {
    List<Empleado> listarTodos();
    Empleado guardar(Empleado empleado);
    Empleado buscarPorId(Integer id);
    void eliminar(Integer id);
}