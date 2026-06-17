package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.TipoProveedor;
import com.elsur.sistema_gestion.repositories.TipoProveedorRepository;
import com.elsur.sistema_gestion.services.TipoProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TipoProveedorServiceImpl implements TipoProveedorService {

    @Autowired
    private TipoProveedorRepository tipoProveedorRepository;

    @Override
    public List<TipoProveedor> listarTodo() {
        return tipoProveedorRepository.findAll();
    }

    @Override
    public TipoProveedor guardar(TipoProveedor tipoProveedor) {
        return tipoProveedorRepository.save(tipoProveedor);
    }

    @Override
    public void eliminar(Integer id) {
        tipoProveedorRepository.deleteById(id);
    }
}