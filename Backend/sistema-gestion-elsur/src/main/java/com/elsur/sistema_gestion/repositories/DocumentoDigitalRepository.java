package com.elsur.sistema_gestion.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.elsur.sistema_gestion.models.DocumentoDigital;

public interface DocumentoDigitalRepository extends JpaRepository<DocumentoDigital, Long> {
}