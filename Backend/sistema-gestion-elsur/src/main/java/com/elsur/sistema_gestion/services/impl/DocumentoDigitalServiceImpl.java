package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;
import com.elsur.sistema_gestion.repositories.DocumentoDigitalRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.services.DocumentoDigitalService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentoDigitalServiceImpl implements DocumentoDigitalService {

    private final Path directorioMateriales = Paths.get("materiales").toAbsolutePath().normalize();

    @Autowired
    private DocumentoDigitalRepository documentoDigitalRepository;

    @Autowired
    private Area_CursoRepository areaCursoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    public DocumentoDigitalServiceImpl() {
        try {
            Files.createDirectories(this.directorioMateriales);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo crear el directorio 'materiales'", e);
        }
    }

    @Override
    public List<DocumentoDigital> findAllActivos() {
        return documentoDigitalRepository.findByEstado("Activo");
    }

    @Override
    public DocumentoDigital findById(Long id) {
        return documentoDigitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + id));
    }

    @Override
    public DocumentoDigital guardarDocumento(
            String titulo,
            String autor,
            String descripcion,
            Long idArea,
            BigDecimal precioBase,
            Integer cantidadPaginas,
            MultipartFile archivo
    ) throws Exception {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo es obligatorio");
        }

        Area_Curso area = areaCursoRepository.findById(idArea)
                .orElseThrow(() -> new RuntimeException("El área/cátedra seleccionada no existe"));

        String nombreOriginal = archivo.getOriginalFilename();
        String extension = "";
        if (nombreOriginal != null && nombreOriginal.contains(".")) {
            extension = nombreOriginal.substring(nombreOriginal.lastIndexOf(".") + 1).toUpperCase();
        }

        // 1. Guardar archivo físico en disco
        String nombreGuardado = UUID.randomUUID().toString() + "_" + (nombreOriginal != null ? nombreOriginal.replaceAll("\\s+", "_") : "archivo");
        Path destino = this.directorioMateriales.resolve(nombreGuardado);
        Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

        // 2. Detección automática de páginas para PDF de forma segura
        int paginasDetectadas = (cantidadPaginas != null && cantidadPaginas > 0) ? cantidadPaginas : 1;
        if ("PDF".equalsIgnoreCase(extension)) {
            try (PDDocument pdfDocument = PDDocument.load(destino.toFile())) {
                paginasDetectadas = pdfDocument.getNumberOfPages();
            } catch (Throwable t) {
                // Si la librería no se encuentra o el PDF está protegido/dañado, mantiene la cantidad especificada o 1
                System.err.println("Aviso: No se pudo contear automáticamente las páginas del PDF. " + t.getMessage());
            }
        }

        // 3. Crear y registrar automáticamente el Producto
        Producto productoAsociado = new Producto();
        productoAsociado.setNombreProducto("Apunte: " + titulo);
        productoAsociado.setPrecioBase(precioBase != null ? precioBase : BigDecimal.ZERO);
        productoAsociado.setStock(999);
        productoAsociado.setEstado("Activo");
        productoAsociado = productoRepository.save(productoAsociado);

        // 4. Registrar Documento Digital en BD
        DocumentoDigital doc = new DocumentoDigital();
        doc.setTitulo(titulo);
        doc.setAutor(autor);
        doc.setDescripcion(descripcion);
        doc.setNombreArchivoOriginal(nombreOriginal);
        doc.setUrlArchivoLocal(nombreGuardado);
        doc.setTipoArchivo(extension);
        doc.setTamanoBytes(archivo.getSize());
        doc.setCantidadPaginas(paginasDetectadas);
        doc.setArea(area);
        doc.setProducto(productoAsociado);
        doc.setEstado("Activo");

        return documentoDigitalRepository.save(doc);
    }

    @Override
    public void eliminarLogico(Long id) {
        DocumentoDigital doc = findById(id);
        doc.setEstado("Inactivo");
        documentoDigitalRepository.save(doc);
    }

    @Override
    public Resource cargarArchivoComoRecurso(String nombreArchivo) throws Exception {
        Path rutaArchivo = this.directorioMateriales.resolve(nombreArchivo).normalize();
        Resource recurso = new UrlResource(rutaArchivo.toUri());
        if (recurso.exists() && recurso.isReadable()) {
            return recurso;
        } else {
            throw new RuntimeException("No se encontró el archivo: " + nombreArchivo);
        }
    }
}