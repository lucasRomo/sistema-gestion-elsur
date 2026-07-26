package com.elsur.sistema_gestion.repositories;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.elsur.sistema_gestion.models.categoriaCliente;

@Repository
public interface categoriaClienteRepository extends JpaRepository<categoriaCliente, Integer>{
    
}
