package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ApiError;
import com.elsur.sistema_gestion.exceptions.GlobalExceptionHandler;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.CifradoService;
import com.elsur.sistema_gestion.services.EmpleadoService;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests de caja blanca (Mockito, sin contexto de Spring) para la lógica de ALTA de
 * usuarios en UsuarioServiceImpl.guardar() -- el módulo "Registrarse" del sistema.
 *
 * Cubren exclusivamente el camino de creación (idUsuario == null), salvo el test de
 * "edita su propio DNI" que ejercita a propósito la rama de edición para probar un
 * caso borde del chequeo de DNI duplicado agregado más abajo.
 *
 * NOTA: se agregó @Mock CifradoService porque UsuarioServiceImpl.guardar() ahora
 * también cifra la contraseña real (feature "Ver contraseña" de Gestión de Usuarios)
 * antes de guardar -- sin este mock, los 4 tests originales de alta fallaban con
 * NullPointerException al llegar a esa línea.
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

    @Mock
    private CifradoService cifradoService;

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
    void altaDeUsuario_passwordVacia_lanzaSolicitudInvalidaYNoGuardaNada() {
        // GAP corregido: a diferencia de CambioPasswordDTO (@Size min=8, max=72),
        // el alta (Usuario crudo, sin @Valid en el controller) no exigía ningún largo
        // mínimo -- se podía crear una cuenta con contraseña vacía o de un solo
        // carácter. Ahora guardar() valida el largo a mano (ver GU20) antes de
        // llegar a la asignación de rol o al hasheo.
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());

        Usuario payload = nuevoUsuario("juan", "");

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> usuarioService.guardar(payload, null));
        assertEquals("La contraseña debe tener entre 8 y 72 caracteres.", ex.getMessage());

        verify(passwordEncoder, never()).encode(anyString());
        verify(usuarioRepository, never()).save(any(Usuario.class));
        verify(usuarioRepository, never()).count();
    }

    @Test
    void altaDeUsuario_passwordDemasiadoLarga_lanzaSolicitudInvalida() {
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());

        String passwordDe73Caracteres = "a".repeat(73);
        Usuario payload = nuevoUsuario("juan", passwordDe73Caracteres);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> usuarioService.guardar(payload, null));
        assertEquals("La contraseña debe tener entre 8 y 72 caracteres.", ex.getMessage());

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void altaDeUsuario_passwordEnElLargoPermitido_seHasheaYGuardaNormalmente() {
        // Caso borde del fix de arriba: el mínimo (8) y el máximo (72) tienen que
        // seguir aceptándose -- este test cubre el límite inferior exacto.
        when(usuarioRepository.count()).thenReturn(3L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ocho1234")).thenReturn("HASH_LARGO_MINIMO");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = nuevoUsuario("juan", "ocho1234"); // exactamente 8 caracteres

        Usuario resultado = assertDoesNotThrow(() -> usuarioService.guardar(payload, null));

        assertEquals("HASH_LARGO_MINIMO", resultado.getPassword());
    }

    // ------------------------------------------------------------------
    // TC_22 (DNI duplicado) -- antes decía "A VERIFICAR EJECUTANDO EL CASO
    // REAL" en la planilla. Se verificó con los tests de abajo que el gap era
    // real (guardar() nunca llamaba a dniExiste(), y un DNI duplicado producía
    // 400 con mensaje crudo de Postgres en vez de 409 con mensaje limpio). Se
    // corrigió agregando un chequeo previo en guardar() (mismo patrón que el
    // de nombreUsuario, unas líneas más arriba) más findByPersonaNumeroDocumento
    // en UsuarioRepository. Estos tests prueban el fix Y documentan el gap
    // residual que el fix no cierra del todo (ventana de carrera).
    // ------------------------------------------------------------------

    @Test
    void altaDeUsuario_dniYaExiste_lanzaRecursoDuplicadoYNoGuardaNada() {
        Usuario existente = new Usuario();
        existente.setIdUsuario(50);
        existente.setNombreUsuario("victoriaM");
        Persona personaExistente = new Persona();
        personaExistente.setNumeroDocumento("45768342");
        existente.setPersona(personaExistente);

        when(usuarioRepository.findByNombreUsuario("nuevoUsuario")).thenReturn(Optional.empty());
        when(usuarioRepository.findByPersonaNumeroDocumento("45768342")).thenReturn(Optional.of(existente));

        Usuario payload = nuevoUsuario("nuevoUsuario", "plano123");
        Persona personaPayload = new Persona();
        personaPayload.setNumeroDocumento("45768342"); // mismo DNI que "existente"
        payload.setPersona(personaPayload);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> usuarioService.guardar(payload, null));
        assertEquals("Ya existe una persona registrada con ese número de documento", ex.getMessage());

        verify(usuarioRepository, never()).save(any(Usuario.class));
        verify(usuarioRepository, never()).count();
    }

    @Test
    void altaDeUsuario_editaSuPropioDni_noSeConsideraDuplicado() {
        // Caso borde del fix de arriba: si no se comparara el idUsuario, cualquier
        // usuario que editara su propio perfil (sin cambiar el DNI) se vería a sí
        // mismo como "duplicado" y no podría guardar nada más. Mismo razonamiento
        // que ya existía para el chequeo de nombreUsuario.
        Usuario usuarioAEditar = new Usuario();
        usuarioAEditar.setIdUsuario(7);
        usuarioAEditar.setNombreUsuario("carla");
        usuarioAEditar.setPassword("$2a$10$hashYaGuardado");
        Persona persona = new Persona();
        persona.setNumeroDocumento("30999888");
        usuarioAEditar.setPersona(persona);

        when(usuarioRepository.findByNombreUsuario("carla")).thenReturn(Optional.of(usuarioAEditar));
        when(usuarioRepository.findByPersonaNumeroDocumento("30999888")).thenReturn(Optional.of(usuarioAEditar));
        when(usuarioRepository.findById(7)).thenReturn(Optional.of(usuarioAEditar));
        when(usuarioRepository.existsById(7)).thenReturn(true);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario payload = new Usuario();
        payload.setIdUsuario(7);
        payload.setNombreUsuario("carla");
        Persona personaPayload = new Persona();
        personaPayload.setNumeroDocumento("30999888"); // mismo DNI, sin cambios
        payload.setPersona(personaPayload);

        assertDoesNotThrow(() -> usuarioService.guardar(payload, null));
    }

    @Test
    void altaDeUsuario_siElUniqueDeLaBaseFrenaElInsert_seTraduceARecursoDuplicado() {
        // GAP corregido: el chequeo previo (findByPersonaNumeroDocumento antes de
        // guardar) cierra el caso normal de TC_22, pero seguía habiendo una ventana
        // de carrera -- dos altas simultáneas con el mismo DNI podían pasar ambas el
        // chequeo antes de que cualquiera de las dos llegara a guardar(). Antes,
        // quien perdía la carrera chocaba contra el UNIQUE de la base con un
        // DataIntegrityViolationException sin traducir, que terminaba como 400 con
        // el mensaje crudo de Postgres. Ahora guardar() atrapa esa excepción puntual
        // y la relanza como RecursoDuplicadoException (409): el resultado observable
        // es siempre el mismo, sin importar el timing. La ventana de carrera en sí
        // sigue existiendo (eso requeriría aislamiento de transacción a nivel de
        // base, fuera de alcance acá), pero ya no se filtra como un error crudo de
        // infraestructura.
        when(usuarioRepository.count()).thenReturn(5L);
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());
        // Simula la ventana de carrera: el chequeo previo no encuentra nada...
        when(usuarioRepository.findByPersonaNumeroDocumento("45768342")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");

        String mensajeCrudoDePostgres =
            "could not execute statement [ERROR: duplicate key value violates unique "
            + "constraint \"persona_numero_documento_key\"]";
        // ...pero al guardar, la restricción UNIQUE de Postgres sí lo frena.
        when(usuarioRepository.save(any(Usuario.class)))
            .thenThrow(new DataIntegrityViolationException(mensajeCrudoDePostgres));

        Usuario payload = nuevoUsuario("otroUsuario", "plano123");
        Persona persona = new Persona();
        persona.setNumeroDocumento("45768342");
        payload.setPersona(persona);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> usuarioService.guardar(payload, null));
        assertEquals("Ya existe un usuario o una persona registrada con esos datos "
                + "(nombre de usuario o número de documento).", ex.getMessage());
    }

    @Test
    void handlerGlobal_anteUnaExcepcionSinTraducir_devuelve400ConMensajeCrudo() {
        // Este test YA NO reproduce un caso alcanzable por TC_22 -- el fix de arriba
        // (altaDeUsuario_siElUniqueDeLaBaseFrenaElInsert_seTraduceARecursoDuplicado)
        // ahora atrapa ese mismo DataIntegrityViolationException dentro de guardar()
        // y lo traduce a un 409 limpio antes de que llegue tan lejos. Lo que queda
        // documentado acá es el comportamiento GENÉRICO de
        // GlobalExceptionHandler.handleRuntimeException como red de contención para
        // cualquier RuntimeException que ningún service traduzca todavía: sigue
        // devolviendo 400 con el mensaje crudo tal cual, sin adivinar nada.
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        String mensajeCrudoDePostgres =
            "could not execute statement [ERROR: duplicate key value violates unique "
            + "constraint \"otra_columna_sin_traducir_key\"]";
        DataIntegrityViolationException ex = new DataIntegrityViolationException(mensajeCrudoDePostgres);

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/usuarios");

        ResponseEntity<ApiError> respuesta = handler.handleRuntimeException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode()); // 400, no 409
        assertNotNull(respuesta.getBody());
        assertEquals(mensajeCrudoDePostgres, respuesta.getBody().mensaje()); // mensaje crudo, no uno legible
    }
}
