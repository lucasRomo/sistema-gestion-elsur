package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Proveedor;
import com.elsur.sistema_gestion.repositories.ProveedorRepository;
import com.elsur.sistema_gestion.services.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProveedorServiceImpl implements ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Override
    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    @Override
    public Proveedor guardar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    @Override
    public void eliminar(Integer id) {
        proveedorRepository.deleteById(id);
    }
}