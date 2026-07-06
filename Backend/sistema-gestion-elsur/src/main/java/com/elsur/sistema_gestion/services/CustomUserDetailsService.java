package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Buscamos el usuario en la DB
        Usuario user = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // Debug para que veas en la consola de IntelliJ/Eclipse qué está pasando
        String nombreRolFinal = "ROLE_" + user.getRol().getNombreRol();
        System.out.println("DEBUG: Cargando usuario: " + user.getNombreUsuario());
        System.out.println("DEBUG: Rol en DB: " + user.getRol().getNombreRol());
        System.out.println("DEBUG: Autoridad asignada: " + nombreRolFinal);

        // 2. Construimos el UserDetails
        // Usamos la contraseña tal cual viene de la DB (porque tu Bean es NoOpPasswordEncoder)
        return User.builder()
        .username(user.getNombreUsuario())
        .password(user.getPassword()) // <--- Usá el nombre exacto de tu campo
        .authorities(nombreRolFinal)
        .build();
    }
}