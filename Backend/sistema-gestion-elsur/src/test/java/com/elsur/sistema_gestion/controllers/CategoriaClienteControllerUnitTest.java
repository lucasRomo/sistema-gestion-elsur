package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.categoriaCliente;
import com.elsur.sistema_gestion.repositories.categoriaClienteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaClienteControllerUnitTest {

    @Mock private categoriaClienteRepository repository;

    @InjectMocks
    private CategoriaClienteController controller;

    private categoriaCliente categoria(String nombre, BigDecimal descuento) {
        categoriaCliente c = new categoriaCliente();
        c.setNombre(nombre);
        c.setDescuentoAutomatico(descuento);
        return c;
    }


    @Test
    @DisplayName("CORREGIDO: nombre nulo se rechaza")
    void guardar_nombreNulo_seRechaza() {
        categoriaCliente c = categoria(null, BigDecimal.TEN);
        assertThrows(SolicitudInvalidaException.class, () -> controller.guardar(c));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre en blanco (solo espacios) se rechaza")
    void guardar_nombreEnBlanco_seRechaza() {
        categoriaCliente c = categoria("   ", BigDecimal.TEN);
        assertThrows(SolicitudInvalidaException.class, () -> controller.guardar(c));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre duplicado (case-insensitive) se rechaza")
    void guardar_nombreDuplicado_lanzaRecursoDuplicado() {
        categoriaCliente c = categoria("mayorista", BigDecimal.TEN);
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot("mayorista", -1)).thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class, () -> controller.guardar(c));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: descuentoAutomatico nulo se completa automáticamente en cero")
    void guardar_descuentoNulo_seCompletaEnCero() {
        categoriaCliente c = categoria("Mayorista", null);
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot(anyString(), any())).thenReturn(false);
        when(repository.save(any(categoriaCliente.class))).thenAnswer(inv -> inv.getArgument(0));

        categoriaCliente resultado = controller.guardar(c);

        assertEquals(0, BigDecimal.ZERO.compareTo(resultado.getDescuentoAutomatico()));
    }

    @Test
    @DisplayName("CORREGIDO: descuentoAutomatico negativo se rechaza")
    void guardar_descuentoNegativo_seRechaza() {
        categoriaCliente c = categoria("Mayorista", new BigDecimal("-5"));
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot(anyString(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class, () -> controller.guardar(c));
        assertTrue(ex.getMessage().toLowerCase().contains("descuento"));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: descuentoAutomatico mayor a 100 se rechaza")
    void guardar_descuentoMayorA100_seRechaza() {
        categoriaCliente c = categoria("Mayorista", new BigDecimal("150"));
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot(anyString(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> controller.guardar(c));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: nombre y descuento válidos persisten la categoría, con el nombre recortado (trim)")
    void guardar_datosValidos_persisteLaCategoria() {
        categoriaCliente c = categoria("  Mayorista  ", new BigDecimal("10"));
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot(anyString(), any())).thenReturn(false);
        when(repository.save(any(categoriaCliente.class))).thenAnswer(inv -> inv.getArgument(0));

        categoriaCliente resultado = controller.guardar(c);

        assertEquals("Mayorista", resultado.getNombre());
        verify(repository).existsByNombreIgnoreCaseAndIdCategoriaNot("Mayorista", -1);
    }


    @Test
    @DisplayName("actualizar: categoría inexistente lanza RecursoNoEncontradoException")
    void actualizar_inexistente_lanzaRecursoNoEncontrado() {
        when(repository.findById(99)).thenReturn(Optional.empty());
        categoriaCliente detalles = categoria("Mayorista", BigDecimal.TEN);

        assertThrows(RecursoNoEncontradoException.class, () -> controller.actualizar(99, detalles));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: actualizar con nombre duplicado contra OTRA categoría se rechaza")
    void actualizar_nombreDuplicadoContraOtraCategoria_seRechaza() {
        categoriaCliente existente = categoria("Minorista", BigDecimal.ZERO);
        existente.setIdCategoria(5);
        when(repository.findById(5)).thenReturn(Optional.of(existente));
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot("Mayorista", 5)).thenReturn(true);

        categoriaCliente detalles = categoria("Mayorista", BigDecimal.TEN);
        assertThrows(RecursoDuplicadoException.class, () -> controller.actualizar(5, detalles));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("actualizar: se permite mantener el mismo nombre de la propia categoría al editar (auto-exclusión)")
    void actualizar_mismoNombrePropio_sePermite() {
        categoriaCliente existente = categoria("Mayorista", BigDecimal.ZERO);
        existente.setIdCategoria(5);
        when(repository.findById(5)).thenReturn(Optional.of(existente));
        when(repository.existsByNombreIgnoreCaseAndIdCategoriaNot("Mayorista", 5)).thenReturn(false);
        when(repository.save(any(categoriaCliente.class))).thenAnswer(inv -> inv.getArgument(0));

        categoriaCliente detalles = categoria("Mayorista", new BigDecimal("15"));
        categoriaCliente resultado = controller.actualizar(5, detalles);

        assertEquals("Mayorista", resultado.getNombre());
        assertEquals(0, new BigDecimal("15").compareTo(resultado.getDescuentoAutomatico()));
    }


    @Test
    @DisplayName("eliminar: categoría inexistente lanza RecursoNoEncontradoException")
    void eliminar_inexistente_lanzaRecursoNoEncontrado() {
        when(repository.existsById(99)).thenReturn(false);
        assertThrows(RecursoNoEncontradoException.class, () -> controller.eliminar(99));
        verify(repository, never()).deleteById(any());
    }

    @Test
    @DisplayName("CORREGIDO: eliminar una categoría en uso por clientes lanza ConflictoDeIntegridadException en vez del error crudo de Hibernate/JDBC")
    void eliminar_enUso_lanzaConflictoDeIntegridad() {
        when(repository.existsById(3)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("fk violation")).when(repository).deleteById(3);

        assertThrows(ConflictoDeIntegridadException.class, () -> controller.eliminar(3));
    }

    @Test
    @DisplayName("eliminar: categoría sin uso se elimina correctamente")
    void eliminar_sinUso_seElimina() {
        when(repository.existsById(4)).thenReturn(true);
        assertDoesNotThrow(() -> controller.eliminar(4));
        verify(repository).deleteById(4);
    }
}
