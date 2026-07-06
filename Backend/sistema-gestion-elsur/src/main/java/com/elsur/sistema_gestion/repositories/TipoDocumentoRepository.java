package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.TipoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoDocumentoRepository extends JpaRepository<TipoDocumento, Integer> {
}