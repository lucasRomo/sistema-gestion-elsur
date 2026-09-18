package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    // Usado para validar nombres duplicados (insensible a mayúsculas/minúsculas),
    // excluyendo el propio producto cuando se trata de una edición.
    boolean existsByNombreProductoIgnoreCaseAndIdProductoNot(String nombreProducto, Integer idProducto);
}
