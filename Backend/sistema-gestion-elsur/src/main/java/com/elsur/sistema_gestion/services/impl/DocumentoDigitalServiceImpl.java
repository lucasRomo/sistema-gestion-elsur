package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.models.DocumentoDigital;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;
import com.elsur.sistema_gestion.repositories.DocumentoDigitalRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.services.DocumentoDigitalService;
import com.elsur.sistema_gestion.services.SupabaseStorageService;

import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.List;

@Service
public class DocumentoDigitalServiceImpl implements DocumentoDigitalService {

    private final Path directorioMateriales = Paths.get("materiales").toAbsolutePath().normalize();

    // --- Parámetros de compresión de PDF ---
    // Calidad de recompresión JPEG para las imágenes embebidas (0.0 a 1.0).
    // 0.5 da una reducción de tamaño notable manteniendo una lectura
    // perfectamente legible para apuntes/documentos escaneados.
    private static final float CALIDAD_JPEG_COMPRESION = 0.5f;
    // Lado máximo (en píxeles) al que se reescala una imagen antes de
    // recomprimirla. La mayoría de los escaneos vienen a una resolución
    // mucho más alta de la necesaria para verse bien en pantalla o imprimirse.
    private static final int DIMENSION_MAXIMA_PX = 1600;
    // Debajo de este tamaño no vale la pena recomprimir (íconos, logos,
    // firmas escaneadas chicas): el ahorro es insignificante y solo se
    // arriesgan artefactos visuales.
    private static final int DIMENSION_MINIMA_PARA_COMPRIMIR = 300;

    @Autowired
    private DocumentoDigitalRepository documentoDigitalRepository;

    @Autowired
    private Area_CursoRepository areaCursoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired private SupabaseStorageService supabaseStorageService;

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
                .orElseThrow(() -> new RecursoNoEncontradoException("Documento no encontrado con ID: " + id));
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
            throw new SolicitudInvalidaException("El archivo es obligatorio");
        }
        if (titulo == null || titulo.isBlank()) {
            throw new SolicitudInvalidaException("El título del documento es obligatorio");
        }
        if (autor == null || autor.isBlank()) {
            throw new SolicitudInvalidaException("El autor/docente es obligatorio");
        }
        if (precioBase != null && precioBase.compareTo(BigDecimal.ZERO) < 0) {
            throw new SolicitudInvalidaException("El precio base no puede ser un valor negativo");
        }

        Area_Curso area = areaCursoRepository.findById(idArea)
                .orElseThrow(() -> new RecursoNoEncontradoException("El área/cátedra seleccionada no existe"));

        String nombreOriginal = archivo.getOriginalFilename();
        String extension = "";
        if (nombreOriginal != null && nombreOriginal.contains(".")) {
            extension = nombreOriginal.substring(nombreOriginal.lastIndexOf(".") + 1).toUpperCase();
        }

        String nombreGuardado;
        long tamanoFinal;
        int paginasDetectadas = (cantidadPaginas != null && cantidadPaginas > 0) ? cantidadPaginas : 1;

        if ("PDF".equalsIgnoreCase(extension)) {
            // 1a. Comprimimos el PDF EN MEMORIA antes de subirlo, y de paso
            // contamos las páginas sobre el mismo documento ya cargado —
            // evita el viaje extra de re-descargarlo desde Supabase solo
            // para contarlas, como hacía la versión anterior.
            ResultadoCompresionPdf resultado = comprimirPdf(archivo.getBytes());
            paginasDetectadas = resultado.paginas > 0 ? resultado.paginas : paginasDetectadas;

            nombreGuardado = supabaseStorageService.generarNombreUnico(nombreOriginal);
            supabaseStorageService.subirBytes(resultado.bytes, nombreGuardado, "application/pdf", "archivos-pedidos");
            tamanoFinal = resultado.bytes.length;
        } else {
            // Otros formatos (imágenes, etc.) se suben tal cual, sin tocar
            // el flujo existente.
            nombreGuardado = supabaseStorageService.subirArchivo(archivo, "archivos-pedidos");
            tamanoFinal = archivo.getSize();
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
        doc.setTamanoBytes(tamanoFinal);
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
    if (doc.getProducto() != null) {
        Producto producto = doc.getProducto();
        producto.setEstado("Inactivo");
        productoRepository.save(producto);
    }}

    @Override
    public byte[] descargarArchivo(String nombreArchivo) throws Exception {
        return supabaseStorageService.descargarArchivo("archivos-pedidos", nombreArchivo);
    }

    // ==================== COMPRESIÓN DE PDF ====================

    private static class ResultadoCompresionPdf {
        final byte[] bytes;
        final int paginas;
        ResultadoCompresionPdf(byte[] bytes, int paginas) {
            this.bytes = bytes;
            this.paginas = paginas;
        }
    }

    /**
     * Recomprime las imágenes embebidas de un PDF (reescalado + JPEG de
     * menor calidad) y devuelve el resultado. Si la compresión falla por
     * cualquier motivo, o si el PDF resultante termina pesando igual o más
     * que el original (típico en PDFs de solo texto, ya optimizados, o
     * protegidos/encriptados), se devuelve el ORIGINAL sin tocar — nunca se
     * sacrifica calidad ni se arriesga un archivo corrupto a cambio de nada.
     */
    private ResultadoCompresionPdf comprimirPdf(byte[] original) {
        try (PDDocument document = PDDocument.load(original)) {
            int totalPaginas = document.getNumberOfPages();

            for (PDPage pagina : document.getPages()) {
                recomprimirImagenesDeRecursos(document, pagina.getResources());
            }

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            document.save(salida);
            byte[] comprimido = salida.toByteArray();

            byte[] bytesFinales = comprimido.length < original.length ? comprimido : original;
            return new ResultadoCompresionPdf(bytesFinales, totalPaginas);

        } catch (Exception e) {
            System.err.println("Aviso: no se pudo comprimir el PDF, se sube sin comprimir. " + e.getMessage());
            return new ResultadoCompresionPdf(original, 0);
        }
    }

    /**
     * Recorre los XObjects de una página (y de los formularios anidados
     * dentro de ella) y reemplaza cada imagen suficientemente grande por su
     * versión reescalada + recomprimida en JPEG, en el mismo lugar del PDF.
     */
    private void recomprimirImagenesDeRecursos(PDDocument document, PDResources recursos) throws Exception {
        if (recursos == null) return;

        for (COSName nombre : recursos.getXObjectNames()) {
            PDXObject xObject = recursos.getXObject(nombre);

            if (xObject instanceof PDImageXObject) {
                PDImageXObject imagenOriginal = (PDImageXObject) xObject;

                if (imagenOriginal.getWidth() < DIMENSION_MINIMA_PARA_COMPRIMIR
                        && imagenOriginal.getHeight() < DIMENSION_MINIMA_PARA_COMPRIMIR) {
                    continue;
                }

                BufferedImage bufferedImage = imagenOriginal.getImage();
                BufferedImage escalada = escalarSiExcede(bufferedImage, DIMENSION_MAXIMA_PX);

                PDImageXObject imagenComprimida =
                        JPEGFactory.createFromImage(document, escalada, CALIDAD_JPEG_COMPRESION);
                recursos.put(nombre, imagenComprimida);

            } else if (xObject instanceof PDFormXObject) {
                // Los "form XObjects" pueden traer sus propias imágenes
                // anidadas (ej: sellos, membretes reutilizados).
                recomprimirImagenesDeRecursos(document, ((PDFormXObject) xObject).getResources());
            }
        }
    }

    private BufferedImage escalarSiExcede(BufferedImage original, int dimensionMaxima) {
        int ancho = original.getWidth();
        int alto = original.getHeight();
        if (ancho <= dimensionMaxima && alto <= dimensionMaxima) return original;

        double factor = (double) dimensionMaxima / Math.max(ancho, alto);
        int nuevoAncho = Math.max(1, (int) Math.round(ancho * factor));
        int nuevoAlto = Math.max(1, (int) Math.round(alto * factor));

        BufferedImage escalada = new BufferedImage(nuevoAncho, nuevoAlto, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = escalada.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(original, 0, 0, nuevoAncho, nuevoAlto, null);
        g2d.dispose();
        return escalada;
    }
}
