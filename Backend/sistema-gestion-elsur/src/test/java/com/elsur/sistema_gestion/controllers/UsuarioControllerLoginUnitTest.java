package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.CredencialesInvalidasException;
import com.elsur.sistema_gestion.exceptions.CuentaNoHabilitadaException;
import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;
import com.elsur.sistema_gestion.services.CifradoService;
import com.elsur.sistema_gestion.security.JwtService;
import com.elsur.sistema_gestion.services.UsuarioService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class UsuarioControllerLoginUnitTest {

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmpleadoRepository empleadoRepository;

    @Mock
    private CifradoService cifradoService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private UsuarioController usuarioController;

    private final BCryptPasswordEncoder encoderReal = new BCryptPasswordEncoder();

    private Usuario usuarioConPassword(String nombreUsuario, String passwordPlana) {
        Usuario u = new Usuario();
        u.setIdUsuario(1);
        u.setNombreUsuario(nombreUsuario);
        u.setPassword(encoderReal.encode(passwordPlana));
        Rol rol = new Rol();
        rol.setIdRol(2);
        rol.setNombreRol("OPERARIO");
        u.setRol(rol);
        return u;
    }

    private Usuario credenciales(String nombreUsuario, String password) {
        Usuario c = new Usuario();
        c.setNombreUsuario(nombreUsuario);
        c.setPassword(password);
        return c;
    }

    @Test
    void login_credencialesCorrectas_devuelveTokenYUsuarioConHttp200() {
        Usuario usuarioEnBase = usuarioConPassword("carla", "miClaveSegura1");

        when(usuarioService.buscarPorNombreUsuario("carla")).thenReturn(Optional.of(usuarioEnBase));
        when(jwtService.generarToken(usuarioEnBase)).thenReturn("token-jwt-simulado");


        ResponseEntity<?> respuesta = usuarioController.login(credenciales("carla", "miClaveSegura1"));

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) respuesta.getBody();
        assertNotNull(body);
        assertEquals("token-jwt-simulado", body.get("token"));
        assertEquals(usuarioEnBase, body.get("usuario"));
    }

    @Test
    void login_usuarioInexistente_lanzaCredencialesInvalidasCon401() {

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        CredencialesInvalidasException ex = assertThrows(CredencialesInvalidasException.class,
                () -> usuarioController.login(credenciales("noExiste", "cualquiera")));
        assertEquals("Credenciales incorrectas", ex.getMessage());
    }

    @Test
    void login_passwordIncorrecta_lanzaElMismoMensajeQueUsuarioInexistente() {

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        CredencialesInvalidasException ex = assertThrows(CredencialesInvalidasException.class,
                () -> usuarioController.login(credenciales("carla", "laClaveIncorrecta")));
        assertEquals("Credenciales incorrectas", ex.getMessage());
    }

    @Test
    void login_cuentaEnEstadoPendiente_lanzaCuentaNoHabilitadaCon403() {
        Usuario usuarioEnBase = usuarioConPassword("nuevo", "claveNueva1");
        Persona persona = new Persona();
        persona.setIdPersona(10);
        usuarioEnBase.setPersona(persona);
        when(usuarioService.buscarPorNombreUsuario("nuevo")).thenReturn(Optional.of(usuarioEnBase));

        Empleado empleado = new Empleado();
        empleado.setEstado("Pendiente");
        when(empleadoRepository.findByPersona_IdPersona(10)).thenReturn(Optional.of(empleado));

        CuentaNoHabilitadaException ex = assertThrows(CuentaNoHabilitadaException.class,
                () -> usuarioController.login(credenciales("nuevo", "claveNueva1")));
        assertTrue(ex.getMessage().toLowerCase().contains("activación"));
    }

    @Test
    void login_cuentaEnEstadoDesactivado_lanzaCuentaNoHabilitadaCon403() {
        Usuario usuarioEnBase = usuarioConPassword("exEmpleado", "claveVieja1");
        Persona persona = new Persona();
        persona.setIdPersona(11);
        usuarioEnBase.setPersona(persona);
        when(usuarioService.buscarPorNombreUsuario("exEmpleado")).thenReturn(Optional.of(usuarioEnBase));

        Empleado empleado = new Empleado();
        empleado.setEstado("Desactivado"); // prueba también que la comparación es case-insensitive
        when(empleadoRepository.findByPersona_IdPersona(11)).thenReturn(Optional.of(empleado));

        assertThrows(CuentaNoHabilitadaException.class,
                () -> usuarioController.login(credenciales("exEmpleado", "claveVieja1")));
    }

    @Test
    void login_passwordNulaEnElPayload_daElMismo401LimpioQueCualquierLoginFallido() {

        Usuario credencialesSinPassword = credenciales("carla", null);

        CredencialesInvalidasException ex = assertThrows(CredencialesInvalidasException.class,
                () -> usuarioController.login(credencialesSinPassword));
        assertEquals("Credenciales incorrectas", ex.getMessage());
        verifyNoInteractions(authenticationManager);
    }

    @Test
    void login_usuarioSinPersonaAsociada_saltaElChequeoDeEstadoYPermiteElLoginIgual() {

        Usuario usuarioSinPersona = usuarioConPassword("sinPersona", "clave12345");
        assertNull(usuarioSinPersona.getPersona());
        when(usuarioService.buscarPorNombreUsuario("sinPersona")).thenReturn(Optional.of(usuarioSinPersona));
        when(jwtService.generarToken(usuarioSinPersona)).thenReturn("token-x");

        ResponseEntity<?> respuesta = usuarioController.login(credenciales("sinPersona", "clave12345"));

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        verifyNoInteractions(empleadoRepository);
    }

    @Test
    void login_usuarioConPersonaPeroSinRegistroDeEmpleado_tambienSalteaElChequeo() {

        Usuario usuarioConPersona = usuarioConPassword("huerfano", "clave98765");
        Persona persona = new Persona();
        persona.setIdPersona(20);
        usuarioConPersona.setPersona(persona);
        when(usuarioService.buscarPorNombreUsuario("huerfano")).thenReturn(Optional.of(usuarioConPersona));
        when(empleadoRepository.findByPersona_IdPersona(20)).thenReturn(Optional.empty());
        when(jwtService.generarToken(usuarioConPersona)).thenReturn("token-y");

        ResponseEntity<?> respuesta = usuarioController.login(credenciales("huerfano", "clave98765"));

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
    }

    @Test
    void jwtService_generarToken_incluyeIdUsuarioYRolComoClaims() {

        JwtService jwtServiceReal = new JwtService();
        ReflectionTestUtils.setField(jwtServiceReal, "secretKey", "secreto-de-test-no-usar-en-produccion");
        ReflectionTestUtils.setField(jwtServiceReal, "expirationTime", 3_600_000L); // 1 hora

        Usuario usuario = usuarioConPassword("valeria", "clave11111");
        usuario.setIdUsuario(42);
        usuario.getRol().setNombreRol("ADMIN");

        String token = jwtServiceReal.generarToken(usuario);

        assertTrue(jwtServiceReal.esTokenValido(token));
        assertEquals("valeria", jwtServiceReal.obtenerUsername(token));
        assertEquals("ADMIN", jwtServiceReal.obtenerRol(token));
        assertEquals(42L, jwtServiceReal.obtenerIdUsuario(token));
    }
}
