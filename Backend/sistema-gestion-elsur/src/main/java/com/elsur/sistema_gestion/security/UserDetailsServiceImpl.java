package com.elsur.sistema_gestion.security;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.services.UsuarioService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Puente entre Usuario (nuestra entidad) y UserDetails (lo que Spring Security
 * necesita para poder usar AuthenticationManager / DaoAuthenticationProvider).
 *
 * ALCANCE A PROPÓSITO ACOTADO: esta clase se usa ÚNICAMENTE en el login
 * (ver UsuarioController.login()), para que la comparación de contraseña pase
 * por el mecanismo "oficial" de Spring Security (DaoAuthenticationProvider +
 * PasswordEncoder) en vez de comparar el hash a mano como antes.
 *
 * NO la usa JwtAuthenticationFilter (que arma la Authentication directo desde
 * los claims del JWT en cada request, sin tocar la base -- por eso el filtro
 * no pega contra la base en cada pedido) ni MatrizSeguridadValidator (que hace
 * su propia consulta a UsuarioRepository para revalidar rol y permisos
 * FRESCOS en cada request, en la etapa de autorización). Esas dos clases ya
 * resuelven, cada una a su manera, lo que un UserDetailsService "clásico"
 * resolvería -- así que esta clase se mantiene con una sola responsabilidad
 * chica en vez de meterla en el medio del filtro o de la matriz y duplicar
 * lógica que ya funciona y está probada.
 *
 * Por eso el UserDetails que devolvemos siempre viene "habilitado" (no usamos
 * isEnabled()/isAccountNonLocked() para bloquear cuentas Pendiente/
 * Desactivado): esa regla de negocio la sigue resolviendo UsuarioController
 * con CuentaNoHabilitadaException después del authenticate(), para no perder
 * el mensaje específico que ya tenía ni la distinción de HTTP status (403).
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioService usuarioService;

    public UserDetailsServiceImpl(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Override
    public UserDetails loadUserByUsername(String nombreUsuario) throws UsernameNotFoundException {
        // A propósito NO se distingue acá "no existe" de ningún otro caso: Spring
        // (DaoAuthenticationProvider, con hideUserNotFoundExceptions=true por
        // defecto) esconde esta UsernameNotFoundException detrás de un
        // BadCredentialsException genérico antes de que llegue al controller.
        // Mismo criterio anti-enumeración que ya usaba el login manual.
        Usuario usuario = usuarioService.buscarPorNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciales incorrectas"));

        String rol = usuario.getRol() != null ? usuario.getRol().getNombreRol() : "Empleado";

        return User.builder()
                .username(usuario.getNombreUsuario())
                .password(usuario.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + rol.toUpperCase())))
                .build();
    }
}
