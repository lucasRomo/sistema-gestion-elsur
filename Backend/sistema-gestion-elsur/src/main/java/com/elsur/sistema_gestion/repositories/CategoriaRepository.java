package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.CategoriaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaRepository extends JpaRepository<CategoriaProducto, Integer> {
    boolean existsByNombreIgnoreCase(String nombre);
}