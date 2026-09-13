package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.EmpleadoService;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests de caja blanca (Mockito, sin contexto de Spring) para la lógica de ALTA de
 * usuarios en UsuarioServiceImpl.guardar() -- el módulo "Registrarse" del sistema.
 *
 * Cubren exclusivamente el camino de creación (idUsuario == null); la edición tiene
 * ramas propias (conservar rol/; password existente, auditoría) que no aplican acá.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceImplRegistroUnitTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EmpleadoService empleadoService;

    @Mock
    private RegistroActividadService registroActividadService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private Usuario nuevoUsuario(String nombreUsuario, String password) {
        Usuario u = new Usuario();
        u.setNombreUsuario(nombreUsuario);
        u.setPassword(password);
        return u;
    }

    @Test
    void altaDeUsuario_primerUsuarioDelSistema_seAsignaRolAdminSinImportarElPayload() {
        when(usuarioRepository.count()).thenReturn(0L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("HASH_BOOTSTRAP");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = nuevoUsuario("admin", "plano123");
        // Alguien podría mandar un rol distinto en el payload; el bootstrap lo ignora.
        Rol rolQueMandaElCliente = new Rol();
        rolQueMandaElCliente.setIdRol(99);
        payload.setRol(rolQueMandaElCliente);

        Usuario resultado = usuarioService.guardar(payload, null);

        assertNotNull(resultado.getRol());
        assertEquals(1, resultado.getRol().getIdRol(),
                "El primer usuario del sistema (count()==0) siempre nace ADMIN (idRol=1).");
    }

    @Test
    void altaDeUsuario_noEsElPrimero_naceOperarioAunqueElPayloadPidaRolAdmin() {
        when(usuarioRepository.count()).thenReturn(5L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = nuevoUsuario("nuevoOperario", "plano123");
        Rol rolAdminEnElPayload = new Rol();
        rolAdminEnElPayload.setIdRol(1); // intento de escalar a ADMIN desde el alta
        payload.setRol(rolAdminEnElPayload);

        Usuario resultado = usuarioService.guardar(payload, null);

        assertNotNull(resultado.getRol());
        assertEquals(2, resultado.getRol().getIdRol(),
                "Regresión de seguridad si esto falla: toda alta que no sea la primera del " +
                "sistema debe nacer OPERARIO (idRol=2) sin importar qué rol venga en el payload.");
    }

    @Test
    void altaDeUsuario_laPasswordSeHasheaConBCryptAntesDeGuardarse() {
        when(usuarioRepository.count()).thenReturn(3L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plano123")).thenReturn("$2a$10$hashSimuladoDelTest");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = nuevoUsuario("juan", "plano123");

        usuarioService.guardar(payload, null);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertEquals("$2a$10$hashSimuladoDelTest", captor.getValue().getPassword(),
                "La contraseña que llega al repository.save() debe ser el hash, nunca el texto plano.");
    }

    @Test
    void altaDeUsuario_nombreUsuarioYaExiste_lanzaRecursoDuplicadoYNoGuardaNada() {
        Usuario existente = new Usuario();
        existente.setIdUsuario(99);
        existente.setNombreUsuario("juan");

        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(existente));

        Usuario payload = nuevoUsuario("juan", "plano123");

        assertThrows(RecursoDuplicadoException.class, () -> usuarioService.guardar(payload, null));

        verify(usuarioRepository, never()).save(any(Usuario.class));
        verify(usuarioRepository, never()).count();
    }

    @Test
    void altaDeUsuario_passwordVacia_seHasheaIgualPorFaltaDeValidacionDeLongitud() {
        // Documenta un hueco real: a diferencia de CambioPasswordDTO (@Size min=8),
        // el alta (Usuario crudo, sin @Valid en el controller) no exige ningún largo
        // mínimo. El service ni siquiera mira si password es vacía: se la pasa tal
        // cual a passwordEncoder.encode().
        when(usuarioRepository.count()).thenReturn(3L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("")).thenReturn("HASH_DE_STRING_VACIO");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = nuevoUsuario("juan", "");

        usuarioService.guardar(payload, null);

        verify(passwordEncoder, times(1)).encode("");
        // No se lanza ninguna excepción por password vacía: el alta se completa igual.
    }
}
