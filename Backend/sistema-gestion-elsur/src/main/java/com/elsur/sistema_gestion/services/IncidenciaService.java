package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Incidencia;
import java.util.List;

public interface IncidenciaService {
    Incidencia registrarFalla(Integer idMaquina, String descripcion, String prioridad, Integer idEmpleadoReporta);
    Incidencia resolverIncidencia(Integer idIncidencia, String resolucion, Integer idEmpleadoResuelve);
    List<Incidencia> obtenerPorMaquina(Integer idMaquina);
    List<Incidencia> listarTodas();
}