package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.TipoProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoProveedorRepository extends JpaRepository<TipoProveedor, Integer> {
}