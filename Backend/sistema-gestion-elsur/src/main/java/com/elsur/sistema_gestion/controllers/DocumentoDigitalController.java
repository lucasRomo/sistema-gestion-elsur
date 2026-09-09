package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.services.DocumentoDigitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.util.List;

@RestController
@RequestMapping("/api/documentos-digital")
@CrossOrigin(origins = "*")
public class DocumentoDigitalController {

    @Autowired
    private DocumentoDigitalService documentoDigitalService;

    @GetMapping
    public List<DocumentoDigital> getAll() {
        return documentoDigitalService.findAllActivos();
    }

    @GetMapping("/{id}")
    public DocumentoDigital getById(@PathVariable Long id) {
        return documentoDigitalService.findById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoDigital> registrarDocumento(
            @RequestParam("titulo") String titulo,
            @RequestParam("autor") String autor,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam("idArea") Long idArea,
            @RequestParam(value = "precioBase", required = false) BigDecimal precioBase,
            @RequestParam(value = "cantidadPaginas", required = false) Integer cantidadPaginas,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        try {
            DocumentoDigital doc = documentoDigitalService.guardarDocumento(
                    titulo, autor, descripcion, idArea, precioBase, cantidadPaginas, archivo
            );
            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarLogico(@PathVariable Long id) {
        try {
            documentoDigitalService.eliminarLogico(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/archivo/{nombreArchivo:.+}")
public ResponseEntity<byte[]> verArchivo(@PathVariable String nombreArchivo) {
    try {
        byte[] datos = documentoDigitalService.descargarArchivo(nombreArchivo);
        String contentType = "application/pdf"; // el repositorio digital son PDFs
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nombreArchivo + "\"")
                .body(datos);
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
}
}