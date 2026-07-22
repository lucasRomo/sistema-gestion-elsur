package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.TipoDocumento;
import java.util.List;

public interface TipoDocumentoService {
    List<TipoDocumento> obtenerTodos();
    TipoDocumento obtenerPorId(Integer id);
}