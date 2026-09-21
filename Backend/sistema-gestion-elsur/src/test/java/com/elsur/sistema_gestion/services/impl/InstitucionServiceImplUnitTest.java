package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.repositories.InstitucionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InstitucionServiceImplUnitTest {

    @Mock private InstitucionRepository institucionRepository;

    @InjectMocks
    private InstitucionServiceImpl institucionService;

    private Institucion institucion(String nombre, String tipo) {
        Institucion i = new Institucion();
        i.setNombreInstitucion(nombre);
        i.setTipoInstitucion(tipo);
        return i;
    }

    @Test
    @DisplayName("findAll: delega directo en el repositorio")
    void findAll_delegaEnElRepositorio() {
        when(institucionRepository.findAll()).thenReturn(java.util.List.of(new Institucion()));
        assertEquals(1, institucionService.findAll().size());
        verify(institucionRepository).findAll();
    }

    @Test
    @DisplayName("CORREGIDO: nombre de institución vacío se rechaza")
    void save_nombreVacio_seRechaza() {
        Institucion institucion = institucion("", "Universidad");

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> institucionService.save(institucion));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre"));
        verify(institucionRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre de institución en blanco (solo espacios) se rechaza")
    void save_nombreEnBlanco_seRechaza() {
        Institucion institucion = institucion("   ", "Universidad");

        assertThrows(SolicitudInvalidaException.class, () -> institucionService.save(institucion));
        verify(institucionRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre nulo se rechaza")
    void save_nombreNulo_seRechaza() {
        Institucion institucion = institucion(null, "Universidad");

        assertThrows(SolicitudInvalidaException.class, () -> institucionService.save(institucion));
        verify(institucionRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre duplicado (case-insensitive) se rechaza con RecursoDuplicadoException en vez de un 500 opaco")
    void save_nombreDuplicado_lanzaRecursoDuplicado() {
        Institucion institucion = institucion("utn frsf", "Universidad");
        when(institucionRepository.existsByNombreInstitucionIgnoreCase("utn frsf")).thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> institucionService.save(institucion));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(institucionRepository, never()).save(any());
    }

    @Test
    @DisplayName("save: datos válidos y nombre único persiste la institución")
    void save_datosValidos_persisteLaInstitucion() {
        Institucion institucion = institucion("UTN FRSF", "Universidad");
        when(institucionRepository.existsByNombreInstitucionIgnoreCase("UTN FRSF")).thenReturn(false);
        when(institucionRepository.save(any(Institucion.class))).thenAnswer(inv -> inv.getArgument(0));

        Institucion resultado = institucionService.save(institucion);

        assertEquals("UTN FRSF", resultado.getNombreInstitucion());
        assertEquals("Universidad", resultado.getTipoInstitucion());
        verify(institucionRepository).save(institucion);
    }

    @Test
    @DisplayName("CORREGIDO: el nombre se recorta (trim) antes de chequear duplicados y de guardar")
    void save_nombreConEspacios_seRecortaAntesDeChequearYGuardar() {
        Institucion institucion = institucion("  UTN FRSF  ", "Universidad");
        when(institucionRepository.existsByNombreInstitucionIgnoreCase("UTN FRSF")).thenReturn(false);
        when(institucionRepository.save(any(Institucion.class))).thenAnswer(inv -> inv.getArgument(0));

        Institucion resultado = institucionService.save(institucion);

        verify(institucionRepository).existsByNombreInstitucionIgnoreCase("UTN FRSF");
        assertEquals("UTN FRSF", resultado.getNombreInstitucion());
    }

    @Test
    @DisplayName("CORREGIDO: un nombre con espacios que ya existe recortado también se detecta como duplicado")
    void save_nombreConEspaciosQueYaExisteRecortado_seRechaza() {
        Institucion institucion = institucion(" utn frsf ", "Universidad");
        when(institucionRepository.existsByNombreInstitucionIgnoreCase("utn frsf")).thenReturn(true);

        assertThrows(RecursoDuplicadoException.class, () -> institucionService.save(institucion));
        verify(institucionRepository, never()).save(any());
    }
}
