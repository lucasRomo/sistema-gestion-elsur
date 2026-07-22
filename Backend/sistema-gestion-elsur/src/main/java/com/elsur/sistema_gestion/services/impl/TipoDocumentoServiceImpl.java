package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.TipoDocumento;
import com.elsur.sistema_gestion.repositories.TipoDocumentoRepository;
import com.elsur.sistema_gestion.services.TipoDocumentoService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TipoDocumentoServiceImpl implements TipoDocumentoService {

    private final TipoDocumentoRepository tipoDocumentoRepository;

    public TipoDocumentoServiceImpl(TipoDocumentoRepository tipoDocumentoRepository) {
        this.tipoDocumentoRepository = tipoDocumentoRepository;
    }

    @Override
    public List<TipoDocumento> obtenerTodos() {
        return tipoDocumentoRepository.findAll();
    }

    @Override
    public TipoDocumento obtenerPorId(Integer id) {
        return tipoDocumentoRepository.findById(id).orElse(null);
    }
}