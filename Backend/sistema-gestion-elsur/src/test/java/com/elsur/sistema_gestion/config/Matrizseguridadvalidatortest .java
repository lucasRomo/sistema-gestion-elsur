package com.elsur.sistema_gestion.config;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.PermisoRepository;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test de INTEGRACIÓN real (no unitario): levanta todo el contexto de Spring
 * -> filtro JWT real, SecurityConfig real, MatrizSeguridadValidator real ->
 * y hace peticiones HTTP de verdad contra tu base de datos de desarrollo
 * (la misma Postgres configurada en application.properties).
 *
 * REQUISITO: tener Postgres levantado localmente antes de correr esto.
 * Los usuarios/roles de prueba se crean y se BORRAN SOLOS: la clase entera
 * corre dentro de una transacción que se revierte al final de cada test
 * (@Transactional), así que nunca ensucia tu base real.
 *
 * Correrlo: mvn -Dtest=MatrizSeguridadValidatorIntegrationTest test
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MatrizSeguridadValidatorIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private RolRepository rolRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PermisoRepository permisoRepository;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    /**
     * Crea un usuario de prueba con un rol nuevo que solo tiene los permisos
     * indicados (buscándolos entre los que YA existen en tu base, los que
     * carga DataInitializer) y devuelve un JWT real y válido para ese usuario.
     */
    private String tokenParaUsuarioDePrueba(String rolNombre, List<String> nombresPermisos, String username) {
        List<Permiso> permisosExistentes = permisoRepository.findAll().stream()
                .filter(p -> nombresPermisos.contains(p.getNombrePermiso()))
                .toList();

        Rol rol = new Rol();
        rol.setNombreRol(rolNombre);
        rol.setPermisos(permisosExistentes);
        rol = rolRepository.save(rol);

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(username);
        usuario.setPassword(passwordEncoder.encode("clave-de-test"));
        usuario.setRol(rol);
        usuario = usuarioRepository.save(usuario);

        return jwtService.generarToken(usuario);
    }

    // ---------- Casos negativos: sin el permiso, tiene que dar 403 ----------

    @Test
    void operario_sin_permiso_de_compras_recibe_403_en_compras_proveedor() throws Exception {
        String token = tokenParaUsuarioDePrueba("OPERARIO", List.of("Clientes"), "test.sin.permiso.compras");

        mockMvc.perform(get("/api/compras-proveedor")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void operario_con_configuracion_recibe_403_en_respaldos() throws Exception {
        String token = tokenParaUsuarioDePrueba("OPERARIO", List.of("Configuración"), "test.config.no.respaldo");

        mockMvc.perform(get("/api/respaldos/historial")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void operario_sin_ningun_permiso_recibe_403_en_clientes() throws Exception {
        String token = tokenParaUsuarioDePrueba("OPERARIO", List.of(), "test.sin.permisos.clientes");

        mockMvc.perform(get("/api/clientes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void sin_token_recibe_error_de_autenticacion() throws Exception {
        mockMvc.perform(get("/api/compras-proveedor"))
                .andExpect(status().is4xxClientError());
    }

    // ---------- Casos positivos: con el permiso, tiene que dejarlo pasar ----------

    @Test
    void operario_con_compra_de_insumos_puede_entrar_a_compras_proveedor() throws Exception {
        String token = tokenParaUsuarioDePrueba("OPERARIO", List.of("Compra de Insumos"), "test.con.permiso.compras");

        mockMvc.perform(get("/api/compras-proveedor")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void admin_puede_entrar_a_respaldos() throws Exception {
        String token = tokenParaUsuarioDePrueba("ADMIN", List.of(), "test.admin.respaldos");

        mockMvc.perform(get("/api/respaldos/historial")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}