package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Tests UNITARIOS de MatrizSeguridadValidator: técnica de "caja blanca"
 * (Unidad 1 de Validación y Verificación) -- se conoce el código y se
 * diseñan los casos para recorrer las rutas lógicas más importantes de
 * evaluarPermisoPorton() / evaluarPermisoEnBaseDeDatos(), sin levantar
 * Spring ni necesitar Postgres: UsuarioRepository se mockea con Mockito
 * y la Authentication/RequestAuthorizationContext se arman a mano.
 *
 * Esto complementa (no reemplaza) al MatrizSeguridadValidatorIntegrationTest
 * que ya tenían: ese es un test de INTEGRACIÓN (caja negra, HTTP real,
 * Postgres real); este corre en milisegundos y sirve para validar la
 * lógica interna en detalle -- incluye regresión explícita de los dos
 * hallazgos de seguridad que se cerraron (escalada por el portón y
 * bypass de "Configuración" para /api/respaldos).
 *
 * Correrlo (no necesita Postgres levantado):
 *   mvn -Dtest=MatrizSeguridadValidatorUnitTest test
 */
@ExtendWith(MockitoExtension.class)
class MatrizSeguridadValidatorUnitTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    // No se usa @InjectMocks a propósito: el constructor de MatrizSeguridadValidator
    // solo pide UsuarioRepository, así que se instancia directo -- queda más explícito.
    private MatrizSeguridadValidator validator;

    private MatrizSeguridadValidator validador() {
        return new MatrizSeguridadValidator(usuarioRepository);
    }

    // ---------- Helpers para armar el contexto de cada request ----------

    private RequestAuthorizationContext contextoPara(String metodo, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(metodo, path);
        request.setServletPath(path);
        return new RequestAuthorizationContext(request);
    }

    private Authentication autenticadoComo(String username, String... roles) {
        List<GrantedAuthority> authorities = Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
        // El constructor de 3 argumentos marca isAuthenticated() = true, igual que
        // hace JwtAuthenticationFilter al armar la Authentication desde el JWT.
        return new UsernamePasswordAuthenticationToken(username, null, authorities);
    }

    private Usuario usuarioConPermisos(String nombreRol, String... permisos) {
        Rol rol = new Rol();
        rol.setNombreRol(nombreRol);
        rol.setPermisos(Arrays.stream(permisos)
                .map(nombre -> {
                    Permiso p = new Permiso();
                    p.setNombrePermiso(nombre);
                    return p;
                })
                .toList());

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario("usuario.test");
        usuario.setRol(rol);
        return usuario;
    }

    // ==================== Casos base de autenticación ====================

    @Test
    @DisplayName("Sin Authentication (null) -> se deniega")
    void sinAuthentication_deniega() {
        validator = validador();

        AuthorizationDecision decision = validator.authorize(() -> null, contextoPara("GET", "/api/clientes"));

        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("Authentication no autenticada -> se deniega")
    void noAutenticado_deniega() {
        validator = validador();
        Authentication auth = new UsernamePasswordAuthenticationToken("usuario.test", "clave"); // 2 args -> authenticated=false

        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes"));

        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("Usuario anónimo (sin loguearse) -> se deniega")
    void anonimo_deniega() {
        validator = validador();
        Authentication auth = new AnonymousAuthenticationToken(
                "key", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));

        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes"));

        assertFalse(decision.isGranted());
    }

    // ==================== ADMIN: bypass total ====================

    @Test
    @DisplayName("ADMIN entra a cualquier módulo sin tener el permiso puntual")
    void admin_bypassTotal() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("ADMIN"))); // sin permisos cargados, ni falta

        Authentication auth = autenticadoComo("admin.test", "ROLE_ADMIN");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes"));

        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("ADMIN puede entrar a /api/respaldos, que para todos los demás es null (bloqueado)")
    void admin_entraARespaldos() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("ADMIN")));

        Authentication auth = autenticadoComo("admin.test", "ROLE_ADMIN");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/respaldos/historial"));

        assertTrue(decision.isGranted());
    }

    // ==================== Regresión: /api/respaldos nunca por permiso ====================

    @Test
    @DisplayName("REGRESIÓN: OPERARIO con 'Configuración' sigue sin poder entrar a /api/respaldos")
    void operarioConConfiguracion_noEntraARespaldos() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO", "Configuración")));

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/respaldos/historial"));

        assertFalse(decision.isGranted());
    }

    // ==================== Asistente: cualquier autenticado entra ====================

    @Test
    @DisplayName("Cualquier usuario autenticado entra a /api/asistente aunque no tenga ningún permiso")
    void asistente_accesibleParaCualquierAutenticado() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO"))); // sin permisos

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/asistente/ayuda"));

        assertTrue(decision.isGranted());
    }

    // ==================== Permisos normales + normalización ====================

    @Test
    @DisplayName("OPERARIO sin el permiso 'Clientes' (ni ninguno de lectura cruzada) no puede leer /api/clientes")
    void operarioSinPermiso_noAccedeAClientes() {
        validator = validador();
        // OJO: "Caja", "Crear Pedido", "Pedidos Pendientes" e "Historial de Pedidos" SÍ dan
        // lectura cruzada de /api/clientes a propósito (esRutaCatalogoVentasYCaja: hace falta
        // poder buscar un cliente al facturar/cobrar). "Insumos" no tiene ninguna relación con
        // clientes, así que es el permiso correcto para probar el caso negativo real.
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO", "Insumos")));

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes"));

        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("REGLA DE NEGOCIO: OPERARIO con 'Caja' SÍ puede leer /api/clientes (lectura cruzada para facturar)")
    void operarioConCaja_siPuedeLeerClientes_porLecturaCruzada() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO", "Caja")));

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes"));

        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("normalizar() ignora tildes/mayúsculas: 'Gestión de Usuarios' habilita GET /api/usuarios")
    void normalizar_ignoraTildesYMayusculas() {
        validator = validador();
        // El permiso se carga con tilde, tal cual lo siembra DataInitializer.
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO", "Gestión de Usuarios")));

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/usuarios"));

        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("El trailing slash no cambia el resultado: /api/clientes/ se evalúa igual que /api/clientes")
    void trailingSlash_seNormaliza() {
        validator = validador();
        when(usuarioRepository.findByNombreUsuario(anyString()))
                .thenReturn(Optional.of(usuarioConPermisos("OPERARIO", "Clientes")));

        Authentication auth = autenticadoComo("operario.test", "ROLE_OPERARIO");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/clientes/"));

        assertTrue(decision.isGranted());
    }

    // ==================== Portón: regresión de la escalada de privilegios ====================

    @Test
    @DisplayName("Portón en bootstrap (tabla usuario vacía) puede crear el primer usuario")
    void porton_bootstrap_creaPrimerUsuario() {
        validator = validador();
        when(usuarioRepository.count()).thenReturn(0L);

        Authentication auth = autenticadoComo("porton", "ROLE_PORTON");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("POST", "/api/usuarios"));

        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("REGRESIÓN: portón ya NO puede crear usuarios una vez que existe al menos uno")
    void porton_fueraDeBootstrap_noPuedeCrearUsuarios() {
        validator = validador();
        when(usuarioRepository.count()).thenReturn(5L);

        Authentication auth = autenticadoComo("porton", "ROLE_PORTON");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("POST", "/api/usuarios"));

        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("El portón nunca pudo crear nada fuera de /api/usuarios y /api/empleados, ni en bootstrap")
    void porton_noAccedeAOtrasRutasNiEnBootstrap() {
        validator = validador();
        when(usuarioRepository.count()).thenReturn(0L);

        Authentication auth = autenticadoComo("porton", "ROLE_PORTON");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("POST", "/api/productos"));

        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("El portón puede consultar tipos-documento por GET, con o sin bootstrap")
    void porton_puedeLeerTiposDocumento_sinImportarBootstrap() {
        validator = validador();
        // Ojo: esta rama de evaluarPermisoPorton (GET) no llama a count(), por eso
        // no se stubea acá -- si lo hiciera, Mockito con MockitoExtension fallaría
        // por "stubbing innecesario", que es justamente la garantía de que la rama
        // GET es independiente del estado de bootstrap.

        Authentication auth = autenticadoComo("porton", "ROLE_PORTON");
        AuthorizationDecision decision = validator.authorize(() -> auth, contextoPara("GET", "/api/tipos-documento"));

        assertTrue(decision.isGranted());
    }
}
