package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Incidencia;
import java.util.List;

public interface IncidenciaService {
    List<Incidencia> listarTodas();
    List<Incidencia> listarPorMaquina(Integer idMaquina);
    Incidencia registrar(Incidencia incidencia);
    void resolverIncidencia(Integer idIncidencia, String resolucion);
}