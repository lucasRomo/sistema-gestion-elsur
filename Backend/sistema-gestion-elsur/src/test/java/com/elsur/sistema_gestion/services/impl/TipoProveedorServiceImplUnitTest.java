package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.TipoProveedor;
import com.elsur.sistema_gestion.repositories.TipoProveedorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class TipoProveedorServiceImplUnitTest {

    @Mock private TipoProveedorRepository tipoProveedorRepository;

    @InjectMocks
    private TipoProveedorServiceImpl tipoProveedorService;

    private TipoProveedor tipoProveedor(String descripcion) {
        TipoProveedor t = new TipoProveedor();
        t.setDescripcion(descripcion);
        return t;
    }

    @Test
    @DisplayName("CORREGIDO: descripción nula se rechaza")
    void guardar_descripcionNula_seRechaza() {
        TipoProveedor t = tipoProveedor(null);
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> tipoProveedorService.guardar(t));
        assertTrue(ex.getMessage().toLowerCase().contains("descripción"));
        verify(tipoProveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: descripción en blanco (solo espacios) se rechaza")
    void guardar_descripcionEnBlanco_seRechaza() {
        TipoProveedor t = tipoProveedor("   ");
        assertThrows(SolicitudInvalidaException.class, () -> tipoProveedorService.guardar(t));
        verify(tipoProveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: descripción duplicada (case-insensitive) se rechaza")
    void guardar_descripcionDuplicada_lanzaRecursoDuplicado() {
        TipoProveedor t = tipoProveedor("insumos graficos");
        when(tipoProveedorRepository.existsByDescripcionIgnoreCaseAndIdTipoProveedorNot("insumos graficos", -1))
                .thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> tipoProveedorService.guardar(t));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(tipoProveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: la descripción se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_descripcionConEspacios_seRecorta() {
        TipoProveedor t = tipoProveedor("  Insumos Graficos  ");
        when(tipoProveedorRepository.existsByDescripcionIgnoreCaseAndIdTipoProveedorNot("Insumos Graficos", -1))
                .thenReturn(false);
        when(tipoProveedorRepository.save(any(TipoProveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoProveedor resultado = tipoProveedorService.guardar(t);

        assertEquals("Insumos Graficos", resultado.getDescripcion());
    }

    @Test
    @DisplayName("guardar: descripción válida y única persiste el tipo de proveedor")
    void guardar_descripcionValida_persisteElTipoDeProveedor() {
        TipoProveedor t = tipoProveedor("Servicios Técnicos");
        when(tipoProveedorRepository.existsByDescripcionIgnoreCaseAndIdTipoProveedorNot("Servicios Técnicos", -1))
                .thenReturn(false);
        when(tipoProveedorRepository.save(any(TipoProveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoProveedor resultado = tipoProveedorService.guardar(t);

        assertEquals("Servicios Técnicos", resultado.getDescripcion());
        verify(tipoProveedorRepository).save(t);
    }

    @Test
    @DisplayName("eliminar: tipo de proveedor inexistente lanza RecursoNoEncontradoException")
    void eliminar_inexistente_lanzaRecursoNoEncontrado() {
        when(tipoProveedorRepository.existsById(99)).thenReturn(false);
        assertThrows(RecursoNoEncontradoException.class, () -> tipoProveedorService.eliminar(99));
        verify(tipoProveedorRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("CORREGIDO: eliminar un tipo de proveedor en uso lanza ConflictoDeIntegridadException en vez del error crudo de Hibernate/JDBC")
    void eliminar_enUso_lanzaConflictoDeIntegridad() {
        when(tipoProveedorRepository.existsById(3)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("fk violation")).when(tipoProveedorRepository).deleteById(3);

        assertThrows(ConflictoDeIntegridadException.class, () -> tipoProveedorService.eliminar(3));
    }

    @Test
    @DisplayName("eliminar: tipo de proveedor sin uso se elimina correctamente")
    void eliminar_sinUso_seElimina() {
        when(tipoProveedorRepository.existsById(4)).thenReturn(true);
        assertDoesNotThrow(() -> tipoProveedorService.eliminar(4));
        verify(tipoProveedorRepository).deleteById(4);
    }
}
