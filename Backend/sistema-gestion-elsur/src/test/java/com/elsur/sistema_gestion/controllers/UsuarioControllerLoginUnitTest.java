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

/**
 * Tests de caja blanca (Mockito, sin contexto de Spring) para UsuarioController.login()
 * -- el módulo "Iniciar Sesión".
 *
 * ACTUALIZADO al incorporar AuthenticationManager/UserDetailsServiceImpl al login (ver
 * MANIFEST del refactor de seguridad): antes login() comparaba el hash a mano con
 * PasswordEncoder.matches() acá mismo, ahora delega esa comparación en
 * authenticationManager.authenticate(...) -- por eso ahora se mockea AuthenticationManager
 * en vez de inyectar un BCryptPasswordEncoder real en el controller. Los casos de "password
 * correcta" no necesitan stub (un mock de Mockito no tirado a propósito simplemente no lanza
 * nada, que es lo que hace un authenticate() exitoso); los de "password incorrecta"/"usuario
 * inexistente" stubean authenticate() para que tire BadCredentialsException, tal cual lo haría
 * el DaoAuthenticationProvider real. La cobertura de casos (TC_L05-TC_L12) es la misma que
 * antes, solo cambia CÓMO se simula el resultado de la validación de credenciales.
 *
 * encoderReal se mantiene solo para armar contraseñas hasheadas realistas en los Usuario de
 * prueba que devuelve el usuarioService mockeado -- ya no se inyecta en el controller, porque
 * login() no vuelve a tocar el campo passwordEncoder (ese campo lo sigue usando
 * verContrasenaReal(), que no se testea en este archivo).
 *
 * Cómo correrlo: .\mvnw.cmd test -Dtest=UsuarioControllerLoginUnitTest
 * (desde la carpeta Backend\sistema-gestion-elsur)
 */
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
        // persona null a propósito acá: este test no ejercita el chequeo de estado de
        // empleado, eso lo cubren los tests dedicados más abajo (TC_L07/TC_L08).
        when(usuarioService.buscarPorNombreUsuario("carla")).thenReturn(Optional.of(usuarioEnBase));
        when(jwtService.generarToken(usuarioEnBase)).thenReturn("token-jwt-simulado");
        // Sin stub de authenticationManager.authenticate(): un mock no configurado no
        // tira nada, que es exactamente lo que hace un authenticate() exitoso.

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
        // Simula lo que hace de verdad DaoAuthenticationProvider cuando
        // UserDetailsServiceImpl.loadUserByUsername() no encuentra el usuario: lo esconde
        // detrás de un BadCredentialsException genérico (hideUserNotFoundExceptions=true
        // por defecto), antes de que el controller llegue siquiera a buscarPorNombreUsuario.
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        CredencialesInvalidasException ex = assertThrows(CredencialesInvalidasException.class,
                () -> usuarioController.login(credenciales("noExiste", "cualquiera")));
        assertEquals("Credenciales incorrectas", ex.getMessage());
    }

    @Test
    void login_passwordIncorrecta_lanzaElMismoMensajeQueUsuarioInexistente() {
        // A propósito: el código comenta que "usuario no existe" y "contraseña
        // incorrecta" deben ser indistinguibles para quien llama, para no filtrar qué
        // nombres de usuario existen en el sistema. Este test prueba que efectivamente
        // lo son (mismo tipo de excepción, mismo mensaje EXACTO que el test anterior) --
        // ahora la garantía la da Spring Security (BadCredentialsException genérico),
        // no una comparación manual en el controller.
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
        // TC_L09 CORREGIDO: antes, un POST sin el campo "password" llegaba como null
        // hasta passwordEncoder.matches(), y BCryptPasswordEncoder (la implementación
        // real que usa el proyecto, vía SecurityConfig) tiraba IllegalArgumentException
        // -- una excepción sin traducir que terminaba en 400 con un mensaje técnico, no
        // en el 401 limpio de cualquier otro login fallido. El chequeo explícito de null
        // en login() sigue estando ANTES de llamar a authenticationManager.authenticate()
        // (que igualmente lo hubiera manejado bien: Spring corta con BadCredentialsException
        // si credentials es null, sin llegar a comparar nada) -- por eso este test no
        // necesita ningún stub de authenticationManager, ni siquiera se lo llega a invocar.
        Usuario credencialesSinPassword = credenciales("carla", null);

        CredencialesInvalidasException ex = assertThrows(CredencialesInvalidasException.class,
                () -> usuarioController.login(credencialesSinPassword));
        assertEquals("Credenciales incorrectas", ex.getMessage());
        verifyNoInteractions(authenticationManager);
    }

    @Test
    void login_usuarioSinPersonaAsociada_saltaElChequeoDeEstadoYPermiteElLoginIgual() {
        // Caso borde documentado (TC_L10), no necesariamente un bug: si un Usuario no
        // tiene Persona asociada (persona == null), el bloque que consulta el estado del
        // Empleado ni siquiera se ejecuta ("if (usuario.getPersona() != null)"), así que
        // el login se completa sin importar si "debería" estar pendiente/desactivado.
        Usuario usuarioSinPersona = usuarioConPassword("sinPersona", "clave12345");
        assertNull(usuarioSinPersona.getPersona());
        when(usuarioService.buscarPorNombreUsuario("sinPersona")).thenReturn(Optional.of(usuarioSinPersona));
        when(jwtService.generarToken(usuarioSinPersona)).thenReturn("token-x");

        ResponseEntity<?> respuesta = usuarioController.login(credenciales("sinPersona", "clave12345"));

        assertEquals(HttpStatus.OK, respuesta.getStatusCode());
        // Y, coherentemente, jamás se consultó el repositorio de empleados.
        verifyNoInteractions(empleadoRepository);
    }

    @Test
    void login_usuarioConPersonaPeroSinRegistroDeEmpleado_tambienSalteaElChequeo() {
        // TC_L11: mismo resultado que el test anterior, pero por otra causa de datos --
        // acá SÍ hay Persona, pero no hay ninguna fila en Empleado para esa persona
        // (empleadoOpt vacío), así que "if (empleadoOpt.isPresent())" nunca entra.
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
        // TC_L12: test chico del JWT real (sin mocks, sin Spring): usa JwtService de
        // verdad, con el secreto y el tiempo de expiración inyectados a mano (los mismos
        // @Value que en producción vienen de application.properties), para probar que el
        // token que se manda al frontend en un login exitoso trae los claims que
        // JwtAuthenticationFilter necesita para reconstruir la autenticación en cada
        // petición siguiente.
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
