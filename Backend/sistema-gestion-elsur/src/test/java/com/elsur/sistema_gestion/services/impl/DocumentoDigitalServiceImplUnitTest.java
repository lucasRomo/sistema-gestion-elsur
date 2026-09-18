package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.SupabaseStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de DocumentoDigitalServiceImpl -- el
 * servicio detrás del módulo "Repositorio Digital". Hasta este trabajo no
 * existía NINGUNA suite de tests para este servicio.
 *
 * HALLAZGOS CORREGIDOS en este pase:
 * 1. guardarDocumento() no validaba título/autor en blanco ni precioBase negativo
 *    -- ahora rechaza con SolicitudInvalidaException.
 * 2. El área/cátedra inexistente y el documento inexistente en findById() lanzaban
 *    un RuntimeException genérico (el controller lo convertía en un 400/404 SIN
 *    CUERPO ni mensaje) -- ahora ambos lanzan RecursoNoEncontradoException, que el
 *    GlobalExceptionHandler traduce a 404 con mensaje real.
 */
@ExtendWith(MockitoExtension.class)
class DocumentoDigitalServiceImplUnitTest {

    @Mock private DocumentoDigitalRepository documentoDigitalRepository;
    @Mock private Area_CursoRepository areaCursoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private SupabaseStorageService supabaseStorageService;
    @Mock private MultipartFile archivo;

    @InjectMocks
    private DocumentoDigitalServiceImpl documentoDigitalService;

    private Area_Curso area(long id) {
        Area_Curso a = new Area_Curso();
        a.setIdArea(id);
        a.setNombreArea("Análisis Matemático I");
        return a;
    }

    // ==================== guardarDocumento -- validaciones ====================

    @Test
    @DisplayName("guardarDocumento: archivo nulo se rechaza")
    void guardarDocumento_archivoNulo_seRechaza() {
        assertThrows(SolicitudInvalidaException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", "Prof. Pérez", null, 1L,
                        BigDecimal.valueOf(500), null, null));
        verifyNoInteractions(areaCursoRepository, documentoDigitalRepository, productoRepository, supabaseStorageService);
    }

    @Test
    @DisplayName("guardarDocumento: archivo vacío se rechaza")
    void guardarDocumento_archivoVacio_seRechaza() {
        when(archivo.isEmpty()).thenReturn(true);

        assertThrows(SolicitudInvalidaException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", "Prof. Pérez", null, 1L,
                        BigDecimal.valueOf(500), null, archivo));
        verifyNoInteractions(areaCursoRepository, documentoDigitalRepository, productoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: título en blanco (solo espacios) se rechaza")
    void guardarDocumento_tituloEnBlanco_seRechaza() {
        when(archivo.isEmpty()).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class, () ->
                documentoDigitalService.guardarDocumento("   ", "Prof. Pérez", null, 1L,
                        BigDecimal.valueOf(500), null, archivo));
        assertTrue(ex.getMessage().toLowerCase().contains("título"));
        verifyNoInteractions(areaCursoRepository, documentoDigitalRepository, productoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: autor nulo se rechaza")
    void guardarDocumento_autorNulo_seRechaza() {
        when(archivo.isEmpty()).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", null, null, 1L,
                        BigDecimal.valueOf(500), null, archivo));
        assertTrue(ex.getMessage().toLowerCase().contains("autor"));
        verifyNoInteractions(areaCursoRepository, documentoDigitalRepository, productoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: precioBase negativo se rechaza")
    void guardarDocumento_precioBaseNegativo_seRechaza() {
        when(archivo.isEmpty()).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", "Prof. Pérez", null, 1L,
                        BigDecimal.valueOf(-500), null, archivo));
        assertTrue(ex.getMessage().toLowerCase().contains("negativo"));
        verifyNoInteractions(areaCursoRepository, documentoDigitalRepository, productoRepository);
    }

    @Test
    @DisplayName("guardarDocumento: precioBase nulo es válido (no se envía precio)")
    void guardarDocumento_precioBaseNulo_noSeRechazaPorEsteChequeo() {
        when(archivo.isEmpty()).thenReturn(false);
        when(areaCursoRepository.findById(1L)).thenReturn(Optional.empty());

        // precioBase == null no debe disparar la validación de negativo -- el
        // siguiente paso (área inexistente) es el que corta la ejecución.
        assertThrows(RecursoNoEncontradoException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", "Prof. Pérez", null, 1L,
                        null, null, archivo));
    }

    @Test
    @DisplayName("CORREGIDO: área/cátedra inexistente ahora lanza RecursoNoEncontradoException (404), no un RuntimeException genérico")
    void guardarDocumento_areaInexistente_lanzaRecursoNoEncontrado() {
        when(archivo.isEmpty()).thenReturn(false);
        when(areaCursoRepository.findById(9999L)).thenReturn(Optional.empty());

        RecursoNoEncontradoException ex = assertThrows(RecursoNoEncontradoException.class, () ->
                documentoDigitalService.guardarDocumento("Guía TP1", "Prof. Pérez", null, 9999L,
                        BigDecimal.valueOf(500), null, archivo));
        assertTrue(ex.getMessage().toLowerCase().contains("no existe"));
        verifyNoInteractions(documentoDigitalRepository, productoRepository, supabaseStorageService);
    }

    // ==================== guardarDocumento -- camino feliz ====================

    @Test
    @DisplayName("guardarDocumento: datos válidos (archivo no-PDF) crea el Producto asociado y persiste el documento")
    void guardarDocumento_datosValidos_creaProductoYDocumento() throws Exception {
        when(archivo.isEmpty()).thenReturn(false);
        when(archivo.getOriginalFilename()).thenReturn("foto.jpg");
        when(archivo.getSize()).thenReturn(2048L);

        Area_Curso areaEncontrada = area(1L);
        when(areaCursoRepository.findById(1L)).thenReturn(Optional.of(areaEncontrada));
        when(supabaseStorageService.subirArchivo(archivo, "archivos-pedidos")).thenReturn("123_abcd1234.jpg");

        Producto productoGuardado = new Producto();
        productoGuardado.setIdProducto(1);
        when(productoRepository.save(any(Producto.class))).thenReturn(productoGuardado);

        when(documentoDigitalRepository.save(any(DocumentoDigital.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DocumentoDigital resultado = documentoDigitalService.guardarDocumento(
                "Apunte Física", "Prof. Gómez", "Notas de cátedra", 1L,
                BigDecimal.valueOf(750), null, archivo);

        assertEquals("Apunte Física", resultado.getTitulo());
        assertEquals("JPG", resultado.getTipoArchivo());
        assertEquals("Activo", resultado.getEstado());
        assertEquals(areaEncontrada, resultado.getArea());
        assertNotNull(resultado.getProducto());

        var productoCaptor = org.mockito.ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(productoCaptor.capture());
        assertEquals("Apunte: Apunte Física", productoCaptor.getValue().getNombreProducto());
        assertEquals(999, productoCaptor.getValue().getStock());
        assertEquals(0, BigDecimal.valueOf(750).compareTo(productoCaptor.getValue().getPrecioBase()));
    }

    // ==================== findById ====================

    @Test
    @DisplayName("CORREGIDO: findById con ID inexistente lanza RecursoNoEncontradoException (404 con mensaje), antes RuntimeException genérico")
    void findById_idInexistente_lanzaRecursoNoEncontrado() {
        when(documentoDigitalRepository.findById(9999L)).thenReturn(Optional.empty());

        RecursoNoEncontradoException ex = assertThrows(RecursoNoEncontradoException.class,
                () -> documentoDigitalService.findById(9999L));
        assertTrue(ex.getMessage().contains("9999"));
    }

    // ==================== eliminarLogico ====================

    @Test
    @DisplayName("eliminarLogico: marca el documento como Inactivo (baja lógica, no borra la fila)")
    void eliminarLogico_marcaEstadoInactivo() {
        DocumentoDigital doc = new DocumentoDigital();
        doc.setIdDocumento(1L);
        doc.setEstado("Activo");
        when(documentoDigitalRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(documentoDigitalRepository.save(any(DocumentoDigital.class))).thenAnswer(inv -> inv.getArgument(0));

        documentoDigitalService.eliminarLogico(1L);

        assertEquals("Inactivo", doc.getEstado());
        verify(documentoDigitalRepository).save(doc);
    }
}
