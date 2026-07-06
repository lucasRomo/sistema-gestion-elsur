package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.repositories.DocumentoDigitalRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DocumentoDigitalService {

    @Autowired
    private DocumentoDigitalRepository documentoDigitalRepository;

    public List<DocumentoDigital> findAll() {
        return documentoDigitalRepository.findAll();
    }

    public DocumentoDigital save(DocumentoDigital documentoDigital) {
        return documentoDigitalRepository.save(documentoDigital);
    }
}