package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {
    // Usado para validar nombre comercial duplicado (insensible a mayúsculas), excluyendo
    // al propio proveedor cuando se está editando -- mismo patrón que Insumo/Producto/Institución.
    boolean existsByNombreComercialIgnoreCaseAndIdProveedorNot(String nombreComercial, Integer idExcluido);
}