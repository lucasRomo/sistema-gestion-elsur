package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.DocumentoDigital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentoDigitalRepository extends JpaRepository<DocumentoDigital, Long> {
    List<DocumentoDigital> findByEstado(String estado);
    boolean existsByTituloIgnoreCaseAndArea_IdAreaAndEstado(String titulo, Long idArea, String estado);
    Optional<DocumentoDigital> findByProducto_IdProducto(Integer idProducto);
}