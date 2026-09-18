package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Proveedor;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ProveedorRepository;
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

/**
 * Tests UNITARIOS (caja blanca, Mockito) de ProveedorServiceImpl (módulo
 * Proveedores). Hasta este trabajo no existía NINGUNA suite de tests para
 * este servicio.
 *
 * HALLAZGOS PRINCIPALES (CORREGIDOS en este pase):
 * 1) nombreComercial no se validaba -- ni blanco, ni duplicado -- pese a ser
 *    nullable=false a nivel de base.
 * 2) Al editar, si no se mandaba idUsuario (o no existía), la auditoría se
 *    atribuía en silencio al "primer usuario de la base" -- mismo patrón
 *    transversal ya cerrado en el resto del sistema.
 * 3) eliminar() no atrapaba DataIntegrityViolationException (proveedor con
 *    compras u otros registros asociados) y dejaba pasar el mensaje crudo de
 *    Hibernate/JDBC.
 *
 * NOTA (frontend, no cubierta acá): ProveedorModal.tsx llamaba a onSave (una
 * función async) sin await y sin try/catch -- cualquier error de estas nuevas
 * validaciones se hubiera perdido como unhandled promise rejection, sin
 * ningún feedback visible para el usuario. Corregido por separado en el
 * frontend (ProveedorModal.tsx / Proveedores.tsx).
 */
@ExtendWith(MockitoExtension.class)
class ProveedorServiceImplUnitTest {

    @Mock private ProveedorRepository proveedorRepository;
    @Mock private RegistroActividadService registroActividadService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private ProveedorServiceImpl proveedorService;

    private Proveedor proveedor(String nombreComercial) {
        Proveedor p = new Proveedor();
        p.setNombreComercial(nombreComercial);
        p.setContactoNombre("Contacto");
        p.setEmailContacto("contacto@proveedor.com");
        return p;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }

    // ---------- guardar: nombreComercial ----------

    @Test
    @DisplayName("CORREGIDO: nombreComercial nulo se rechaza")
    void guardar_nombreComercialNulo_seRechaza() {
        Proveedor p = proveedor(null);
        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> proveedorService.guardar(p, null));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre comercial"));
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombreComercial en blanco (solo espacios) se rechaza")
    void guardar_nombreComercialEnBlanco_seRechaza() {
        Proveedor p = proveedor("   ");
        assertThrows(SolicitudInvalidaException.class, () -> proveedorService.guardar(p, null));
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombreComercial duplicado (case-insensitive) se rechaza")
    void guardar_nombreComercialDuplicado_lanzaRecursoDuplicado() {
        Proveedor p = proveedor("papelera del sur");
        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot("papelera del sur", -1))
                .thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> proveedorService.guardar(p, null));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: el nombreComercial se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_nombreComercialConEspacios_seRecorta() {
        Proveedor p = proveedor("  Papelera Del Sur  ");
        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot("Papelera Del Sur", -1))
                .thenReturn(false);
        when(proveedorRepository.save(any(Proveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        Proveedor resultado = proveedorService.guardar(p, null);

        assertEquals("Papelera Del Sur", resultado.getNombreComercial());
        verify(proveedorRepository).existsByNombreComercialIgnoreCaseAndIdProveedorNot("Papelera Del Sur", -1);
    }

    @Test
    @DisplayName("guardar: estado en blanco se completa automáticamente como 'Activo'")
    void guardar_estadoEnBlanco_seCompletaComoActivo() {
        Proveedor p = proveedor("Proveedor Uno");
        p.setEstado("");
        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot(anyString(), any())).thenReturn(false);
        when(proveedorRepository.save(any(Proveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        Proveedor resultado = proveedorService.guardar(p, null);

        assertEquals("Activo", resultado.getEstado());
    }

    // ---------- guardar: auditoría / obtenerUsuarioOperador ----------

    @Test
    @DisplayName("CORREGIDO: al editar sin idUsuario se rechaza en vez de atribuir en silencio al primer usuario de la base")
    void guardar_edicionSinIdUsuario_seRechaza() {
        Proveedor p = proveedor("Proveedor Existente");
        p.setIdProveedor(10);

        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot(anyString(), any())).thenReturn(false);
        when(proveedorRepository.existsById(10)).thenReturn(true);
        when(proveedorRepository.findById(10)).thenReturn(Optional.of(proveedor("Proveedor Viejo")));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> proveedorService.guardar(p, null));
        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: al editar con idUsuario que no existe se rechaza")
    void guardar_edicionConIdUsuarioInexistente_seRechaza() {
        Proveedor p = proveedor("Proveedor Existente");
        p.setIdProveedor(10);

        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot(anyString(), any())).thenReturn(false);
        when(proveedorRepository.existsById(10)).thenReturn(true);
        when(proveedorRepository.findById(10)).thenReturn(Optional.of(proveedor("Proveedor Viejo")));
        when(usuarioRepository.findById(555)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class, () -> proveedorService.guardar(p, 555));
        verify(proveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: edición con usuario válido registra auditoría y persiste")
    void guardar_edicionConUsuarioValido_persisteYAuditaCambios() {
        Proveedor p = proveedor("Proveedor Modificado");
        p.setIdProveedor(10);
        Proveedor viejo = proveedor("Proveedor Original");

        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot(anyString(), any())).thenReturn(false);
        when(proveedorRepository.existsById(10)).thenReturn(true);
        when(proveedorRepository.findById(10)).thenReturn(Optional.of(viejo));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(proveedorRepository.save(any(Proveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        Proveedor resultado = proveedorService.guardar(p, 1);

        assertEquals("Proveedor Modificado", resultado.getNombreComercial());
        verify(registroActividadService, atLeastOnce()).registrarCambio(any(), eq("UPDATE"), eq("Proveedor"), eq("nombreComercial"), eq(10), anyString(), anyString());
    }

    @Test
    @DisplayName("guardar: alta de proveedor nuevo (sin idProveedor) no exige idUsuario")
    void guardar_altaDeProveedorNuevo_noExigeUsuario() {
        Proveedor p = proveedor("Proveedor Nuevo");
        when(proveedorRepository.existsByNombreComercialIgnoreCaseAndIdProveedorNot(anyString(), any())).thenReturn(false);
        when(proveedorRepository.save(any(Proveedor.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> proveedorService.guardar(p, null));
        verify(usuarioRepository, never()).findById(any());
    }

    // ---------- eliminar ----------

    @Test
    @DisplayName("eliminar: proveedor inexistente lanza RecursoNoEncontradoException")
    void eliminar_inexistente_lanzaRecursoNoEncontrado() {
        when(proveedorRepository.existsById(99)).thenReturn(false);
        assertThrows(RecursoNoEncontradoException.class, () -> proveedorService.eliminar(99));
        verify(proveedorRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("CORREGIDO: eliminar un proveedor con registros asociados lanza ConflictoDeIntegridadException en vez del error crudo de Hibernate/JDBC")
    void eliminar_conRegistrosAsociados_lanzaConflictoDeIntegridad() {
        when(proveedorRepository.existsById(3)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("fk violation")).when(proveedorRepository).deleteById(3);

        assertThrows(ConflictoDeIntegridadException.class, () -> proveedorService.eliminar(3));
    }

    @Test
    @DisplayName("eliminar: proveedor sin registros asociados se elimina correctamente")
    void eliminar_sinRegistrosAsociados_seElimina() {
        when(proveedorRepository.existsById(4)).thenReturn(true);
        assertDoesNotThrow(() -> proveedorService.eliminar(4));
        verify(proveedorRepository).deleteById(4);
    }
}
