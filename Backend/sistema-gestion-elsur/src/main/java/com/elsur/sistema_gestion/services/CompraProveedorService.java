package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.CompraProveedor;
import com.elsur.sistema_gestion.repositories.CompraProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompraProveedorService {

    @Autowired
    private CompraProveedorRepository compraProveedorRepository;

    public List<CompraProveedor> findAll() {
        return compraProveedorRepository.findAll();
    }

    public CompraProveedor save(CompraProveedor compraProveedor) {
        return compraProveedorRepository.save(compraProveedor);
    }
}