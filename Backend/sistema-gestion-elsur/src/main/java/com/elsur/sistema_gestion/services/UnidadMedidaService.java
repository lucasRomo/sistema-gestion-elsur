package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.UnidadMedida;
import java.util.List;

public interface UnidadMedidaService {
    List<UnidadMedida> obtenerTodas();
    UnidadMedida guardar(UnidadMedida unidadMedida);
    void eliminar(Integer id);
}