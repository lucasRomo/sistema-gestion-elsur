package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.controllers.ProductoInsumoController.RecetaItemDTO;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de ProductoInsumoController.actualizarReceta
 * (módulo Productos, modal "Configurar Receta / Insumos"). Hasta este trabajo no
 * existía NINGUNA suite de tests para este controller -- la lógica de negocio vive
 * directamente en el controller, sin una capa de service intermedia.
 *
 * HALLAZGOS PRINCIPALES (CORREGIDOS en este pase):
 * 1) No se validaba nada de los ítems recibidos: una cantidadConsumo nula
 *    reventaba como una DataIntegrityViolationException opaca (la columna es
 *    NOT NULL) y un insumo repetido en el mismo envío chocaba contra la clave
 *    primaria compuesta (idProducto + idInsumo), ambos devolviendo un 500
 *    genérico sin ningún mensaje útil para el usuario.
 * 2) Producto/Insumo no encontrado usaba RuntimeException genérico (-> 400)
 *    en vez de RecursoNoEncontradoException (-> 404).
 */
@ExtendWith(MockitoExtension.class)
class ProductoInsumoControllerUnitTest {

    @Mock private ProductoInsumoRepository productoInsumoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private InsumoRepository insumoRepository;

    @InjectMocks
    private ProductoInsumoController controller;

    private RecetaItemDTO item(Integer idInsumo, BigDecimal cantidad) {
        RecetaItemDTO dto = new RecetaItemDTO();
        dto.setIdInsumo(idInsumo);
        dto.setCantidadConsumo(cantidad);
        return dto;
    }

    private Producto producto(int id) {
        Producto p = new Producto();
        p.setIdProducto(id);
        return p;
    }

    private Insumo insumo(int id) {
        Insumo i = new Insumo();
        i.setIdInsumo(id);
        return i;
    }

    @Test
    @DisplayName("CORREGIDO: producto inexistente lanza RecursoNoEncontradoException (404), antes era un RuntimeException genérico (400)")
    void actualizarReceta_productoInexistente_lanzaRecursoNoEncontrado() {
        when(productoRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> controller.actualizarReceta(99, List.of(item(1, BigDecimal.ONE))));
        verify(productoInsumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("CORREGIDO: una cantidadConsumo nula se rechaza en vez de reventar como un 500 opaco por la restricción NOT NULL")
    void actualizarReceta_cantidadConsumoNula_seRechaza() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(producto(1)));
        when(productoInsumoRepository.findByIdIdProducto(1)).thenReturn(Collections.emptyList());

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> controller.actualizarReceta(1, List.of(item(10, null))));
        assertTrue(ex.getMessage().toLowerCase().contains("cantidad"));
        verify(productoInsumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("CORREGIDO: una cantidadConsumo <= 0 se rechaza")
    void actualizarReceta_cantidadConsumoCero_seRechaza() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(producto(1)));
        when(productoInsumoRepository.findByIdIdProducto(1)).thenReturn(Collections.emptyList());

        assertThrows(SolicitudInvalidaException.class,
                () -> controller.actualizarReceta(1, List.of(item(10, BigDecimal.ZERO))));
        verify(productoInsumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("CORREGIDO: un insumo repetido en el mismo envío se rechaza en vez de chocar contra la clave primaria compuesta")
    void actualizarReceta_insumoRepetido_seRechaza() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(producto(1)));
        when(productoInsumoRepository.findByIdIdProducto(1)).thenReturn(Collections.emptyList());

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> controller.actualizarReceta(1, List.of(
                        item(10, BigDecimal.ONE),
                        item(10, new BigDecimal("2"))
                )));
        assertTrue(ex.getMessage().toLowerCase().contains("repetido"));
        verify(productoInsumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("CORREGIDO: un insumo inexistente lanza RecursoNoEncontradoException (404)")
    void actualizarReceta_insumoInexistente_lanzaRecursoNoEncontrado() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(producto(1)));
        when(productoInsumoRepository.findByIdIdProducto(1)).thenReturn(Collections.emptyList());
        when(insumoRepository.findById(10)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> controller.actualizarReceta(1, List.of(item(10, BigDecimal.ONE))));
    }

    @Test
    @DisplayName("actualizarReceta: datos válidos reemplaza la receta existente por la nueva")
    void actualizarReceta_datosValidos_reemplazaLaReceta() {
        when(productoRepository.findById(1)).thenReturn(Optional.of(producto(1)));
        when(productoInsumoRepository.findByIdIdProducto(1)).thenReturn(Collections.emptyList());
        when(insumoRepository.findById(10)).thenReturn(Optional.of(insumo(10)));
        when(productoInsumoRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = controller.actualizarReceta(1, List.of(item(10, new BigDecimal("2.5"))));

        assertEquals(200, response.getStatusCode().value());
        verify(productoInsumoRepository).saveAll(any());
    }
}
