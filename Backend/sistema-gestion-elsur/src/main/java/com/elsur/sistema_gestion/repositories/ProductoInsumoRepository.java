package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.ProductoInsumo;
import com.elsur.sistema_gestion.models.ProductoInsumo.ProductoInsumoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoInsumoRepository extends JpaRepository<ProductoInsumo, ProductoInsumoId> {
    
    List<ProductoInsumo> findByProducto(Producto producto);
    
    List<ProductoInsumo> findByIdIdProducto(Integer idProducto);
}