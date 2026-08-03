package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.DocumentoDigital;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface DocumentoDigitalService {
    List<DocumentoDigital> findAllActivos();
    DocumentoDigital findById(Long id);
    DocumentoDigital guardarDocumento(
            String titulo,
            String autor,
            String descripcion,
            Long idArea,
            BigDecimal precioBase,
            Integer cantidadPaginas,
            MultipartFile archivo
    ) throws Exception;
    void eliminarLogico(Long id);
    Resource cargarArchivoComoRecurso(String nombreArchivo) throws Exception;
}