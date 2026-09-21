package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Area_Curso;
import com.elsur.sistema_gestion.models.Institucion;
import com.elsur.sistema_gestion.repositories.Area_CursoRepository;
import com.elsur.sistema_gestion.repositories.InstitucionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class Area_CursoServiceImplUnitTest {

    @Mock private Area_CursoRepository areaCursoRepository;
    @Mock private InstitucionRepository institucionRepository;

    @InjectMocks
    private Area_CursoServiceImpl areaCursoService;

    private Institucion institucion(long id) {
        Institucion i = new Institucion();
        i.setIdInstitucion(id);
        i.setNombreInstitucion("UTN FRSF");
        return i;
    }

    private Area_Curso areaConInstitucion(String nombre, Long idInstitucion) {
        Area_Curso a = new Area_Curso();
        a.setNombreArea(nombre);
        if (idInstitucion != null) {
            Institucion ref = new Institucion();
            ref.setIdInstitucion(idInstitucion);
            a.setInstitucion(ref);
        }
        return a;
    }

    @Test
    @DisplayName("findAll: delega directo en el repositorio")
    void findAll_delegaEnElRepositorio() {
        when(areaCursoRepository.findAll()).thenReturn(java.util.List.of(new Area_Curso()));
        assertEquals(1, areaCursoService.findAll().size());
        verify(areaCursoRepository).findAll();
    }

    @Test
    @DisplayName("CORREGIDO: nombre de cátedra/área vacío se rechaza")
    void save_nombreVacio_seRechaza() {
        Area_Curso area = areaConInstitucion("", 1L);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> areaCursoService.save(area));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre"));
        verifyNoInteractions(institucionRepository, areaCursoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: nombre de cátedra/área en blanco (solo espacios) se rechaza")
    void save_nombreEnBlanco_seRechaza() {
        Area_Curso area = areaConInstitucion("   ", 1L);

        assertThrows(SolicitudInvalidaException.class, () -> areaCursoService.save(area));
        verifyNoInteractions(institucionRepository, areaCursoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: institución nula en el payload se rechaza")
    void save_sinInstitucion_seRechaza() {
        Area_Curso area = areaConInstitucion("Análisis Matemático I", null);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> areaCursoService.save(area));
        assertTrue(ex.getMessage().toLowerCase().contains("institución"));
        verifyNoInteractions(institucionRepository, areaCursoRepository);
    }

    @Test
    @DisplayName("CORREGIDO: institución con ID inexistente ahora se rechaza con RecursoNoEncontradoException, antes fallaba en JPA sin traducir")
    void save_institucionInexistente_lanzaRecursoNoEncontrado() {
        Area_Curso area = areaConInstitucion("Análisis Matemático I", 9999L);
        when(institucionRepository.findById(9999L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> areaCursoService.save(area));
        verify(areaCursoRepository, never()).save(any());
    }

    @Test
    @DisplayName("save: datos válidos persiste la cátedra con la institución completa resuelta desde la base")
    void save_datosValidos_persisteConInstitucionResuelta() {
        Area_Curso area = areaConInstitucion("Análisis Matemático I", 1L);
        Institucion institucionCompleta = institucion(1L);
        when(institucionRepository.findById(1L)).thenReturn(Optional.of(institucionCompleta));
        when(areaCursoRepository.save(any(Area_Curso.class))).thenAnswer(inv -> inv.getArgument(0));

        Area_Curso resultado = areaCursoService.save(area);

        assertEquals("Análisis Matemático I", resultado.getNombreArea());
        assertEquals(institucionCompleta, resultado.getInstitucion());
        assertEquals("UTN FRSF", resultado.getInstitucion().getNombreInstitucion());
    }

    @Test
    @DisplayName("CORREGIDO: el nombre de la cátedra se recorta (trim) antes de guardar")
    void save_nombreConEspacios_seRecortaAntesDeGuardar() {
        Area_Curso area = areaConInstitucion("  Análisis Matemático I  ", 1L);
        when(institucionRepository.findById(1L)).thenReturn(Optional.of(institucion(1L)));
        when(areaCursoRepository.save(any(Area_Curso.class))).thenAnswer(inv -> inv.getArgument(0));

        Area_Curso resultado = areaCursoService.save(area);

        assertEquals("Análisis Matemático I", resultado.getNombreArea());
    }
}
