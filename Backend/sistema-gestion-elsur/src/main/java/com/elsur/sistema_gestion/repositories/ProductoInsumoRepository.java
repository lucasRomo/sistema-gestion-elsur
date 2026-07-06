package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.ProductoInsumo;

import jakarta.persistence.EmbeddedId;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoInsumoRepository extends JpaRepository<ProductoInsumo, EmbeddedId> {
    List<ProductoInsumo> findByProducto(Producto producto);
}
