package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, Integer> {

    // Usado para validar nombres duplicados (insensible a mayúsculas/minúsculas),
    // excluyendo el propio insumo cuando se trata de una edición.
    boolean existsByNombreInsumoIgnoreCaseAndIdInsumoNot(String nombreInsumo, Integer idInsumo);
}