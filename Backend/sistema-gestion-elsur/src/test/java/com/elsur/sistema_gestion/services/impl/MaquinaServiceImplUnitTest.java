package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.MaquinaRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class MaquinaServiceImplUnitTest {

    @Mock private MaquinaRepository maquinaRepository;
    @Mock private RegistroActividadService registroActividadService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private MaquinaServiceImpl maquinaService;

    private Maquina maquina(String nombre, String estado) {
        Maquina m = new Maquina();
        m.setNombre(nombre);
        m.setEstado(estado);
        m.setActivo(true);
        return m;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }


    @Test
    @DisplayName("buscarPorId: máquina inexistente lanza RecursoNoEncontradoException")
    void buscarPorId_inexistente_lanzaRecursoNoEncontrado() {
        when(maquinaRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> maquinaService.buscarPorId(99));
    }


    @Test
    @DisplayName("CORREGIDO: nombre nulo se rechaza")
    void guardar_nombreNulo_seRechaza() {
        Maquina m = maquina(null, "OPERATIVA");
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> maquinaService.guardar(m, null));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre"));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre en blanco (solo espacios) se rechaza")
    void guardar_nombreEnBlanco_seRechaza() {
        Maquina m = maquina("   ", "OPERATIVA");
        assertThrows(SolicitudInvalidaException.class, () -> maquinaService.guardar(m, null));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre duplicado (case-insensitive) se rechaza -- antes nunca se llamaba al existsBy correspondiente")
    void guardar_nombreDuplicado_lanzaRecursoDuplicado() {
        Maquina m = maquina("impresora offset 1", "OPERATIVA");
        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot("impresora offset 1", -1))
                .thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> maquinaService.guardar(m, null));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: el nombre se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_nombreConEspacios_seRecorta() {
        Maquina m = maquina("  Impresora Offset 1  ", "OPERATIVA");
        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot("Impresora Offset 1", -1)).thenReturn(false);
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

        Maquina resultado = maquinaService.guardar(m, null);

        assertEquals("Impresora Offset 1", resultado.getNombre());
    }


    @Test
    @DisplayName("guardar: estado en blanco se completa automáticamente como 'OPERATIVA'")
    void guardar_estadoEnBlanco_seCompletaComoOperativa() {
        Maquina m = maquina("Maquina Uno", "");
        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

        Maquina resultado = maquinaService.guardar(m, null);

        assertEquals("OPERATIVA", resultado.getEstado());
    }

    @Test
    @DisplayName("CORREGIDO: guardar con un estado inválido (no reconocido) se rechaza")
    void guardar_estadoInvalido_seRechaza() {
        Maquina m = maquina("Maquina Uno", "ESTADO_INVENTADO");
        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> maquinaService.guardar(m, null));
        assertTrue(ex.getMessage().toLowerCase().contains("estado"));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: los 4 estados válidos (OPERATIVA, FUERA DE SERVICIO, FALLA, MANTENIMIENTO) se aceptan")
    void guardar_estadosValidos_seAceptan() {
        for (String estado : new String[]{"OPERATIVA", "FUERA DE SERVICIO", "FALLA", "MANTENIMIENTO"}) {
            Maquina m = maquina("Maquina " + estado, estado);
            when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);
            when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> maquinaService.guardar(m, null));
        }
    }


    @Test
    @DisplayName("CORREGIDO: al editar sin idUsuarioOperador se rechaza en vez de atribuir en silencio al primer usuario de la base")
    void guardar_edicionSinIdUsuario_seRechaza() {
        Maquina m = maquina("Maquina Existente", "OPERATIVA");
        m.setIdMaquina(10);

        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);
        when(maquinaRepository.existsById(10)).thenReturn(true);
        when(maquinaRepository.findById(10)).thenReturn(Optional.of(maquina("Maquina Vieja", "OPERATIVA")));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> maquinaService.guardar(m, null));
        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: edición con usuario válido registra auditoría y persiste")
    void guardar_edicionConUsuarioValido_persisteYAuditaCambios() {
        Maquina m = maquina("Maquina Modificada", "FALLA");
        m.setIdMaquina(10);
        Maquina vieja = maquina("Maquina Original", "OPERATIVA");

        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);
        when(maquinaRepository.existsById(10)).thenReturn(true);
        when(maquinaRepository.findById(10)).thenReturn(Optional.of(vieja));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

        Maquina resultado = maquinaService.guardar(m, 1);

        assertEquals("Maquina Modificada", resultado.getNombre());
        verify(registroActividadService).registrarCambio(any(), eq("UPDATE"), eq("Maquina"), eq("estado"), eq(10), eq("OPERATIVA"), eq("FALLA"));
    }

    @Test
    @DisplayName("guardar: alta de máquina nueva (sin idMaquina) no exige idUsuario")
    void guardar_altaDeMaquinaNueva_noExigeUsuario() {
        Maquina m = maquina("Maquina Nueva", "OPERATIVA");
        when(maquinaRepository.existsByNombreIgnoreCaseAndIdMaquinaNot(anyString(), any())).thenReturn(false);
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> maquinaService.guardar(m, null));
        verify(usuarioRepository, never()).findById(any());
    }

    @Test
    @DisplayName("CORREGIDO: cambiarEstado con un valor inválido se rechaza")
    void cambiarEstado_valorInvalido_seRechaza() {
        assertThrows(SolicitudInvalidaException.class, () -> maquinaService.cambiarEstado(1, "ROTA", 1));
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: cambiarEstado normaliza guiones bajos a espacios (misma grafía que usa el frontend)")
    void cambiarEstado_conGuionBajo_seNormalizaAEspacios() {
        Maquina m = maquina("Maquina Uno", "OPERATIVA");
        m.setIdMaquina(1);
        when(maquinaRepository.findById(1)).thenReturn(Optional.of(m));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(inv -> inv.getArgument(0));

        Maquina resultado = maquinaService.cambiarEstado(1, "fuera_de_servicio", 1);

        assertEquals("FUERA DE SERVICIO", resultado.getEstado());
    }

    @Test
    @DisplayName("cambiarEstado: sin usuario operador se rechaza")
    void cambiarEstado_sinUsuario_seRechaza() {
        Maquina m = maquina("Maquina Uno", "OPERATIVA");
        m.setIdMaquina(1);
        when(maquinaRepository.findById(1)).thenReturn(Optional.of(m));

        assertThrows(SolicitudInvalidaException.class, () -> maquinaService.cambiarEstado(1, "FALLA", null));
        verify(maquinaRepository, never()).save(any());
    }


    @Test
    @DisplayName("eliminar: máquina inexistente lanza RecursoNoEncontradoException")
    void eliminar_inexistente_lanzaRecursoNoEncontrado() {
        when(maquinaRepository.existsById(99)).thenReturn(false);
        assertThrows(RecursoNoEncontradoException.class, () -> maquinaService.eliminar(99));
        verify(maquinaRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("CORREGIDO: eliminar una máquina asociada a un producto lanza ConflictoDeIntegridadException en vez del error crudo de Hibernate/JDBC")
    void eliminar_asociadaAProducto_lanzaConflictoDeIntegridad() {
        when(maquinaRepository.existsById(3)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("fk violation")).when(maquinaRepository).deleteById(3);

        assertThrows(ConflictoDeIntegridadException.class, () -> maquinaService.eliminar(3));
    }

    @Test
    @DisplayName("eliminar: máquina sin asociaciones se elimina correctamente")
    void eliminar_sinAsociaciones_seElimina() {
        when(maquinaRepository.existsById(4)).thenReturn(true);
        assertDoesNotThrow(() -> maquinaService.eliminar(4));
        verify(maquinaRepository).deleteById(4);
    }
}
