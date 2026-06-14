package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    @Override
    public Usuario buscarPorId(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Override
    public Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario);
    }

    @Override
    @Transactional
    public Usuario guardar(Usuario usuario) {
        // Validación: que el nombre de usuario no esté duplicado
        Optional<Usuario> existente = usuarioRepository.findByNombreUsuario(usuario.getNombreUsuario());
        if (existente.isPresent() && !existente.get().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }
        return usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void cambiarPassword(Integer idUsuario, String nuevaPassword) {
        Usuario user = buscarPorId(idUsuario);
        user.setPassword(nuevaPassword); // Por ahora texto plano, luego BCrypt
        usuarioRepository.save(user);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        usuarioRepository.deleteById(id);
    }

    @Override
    public boolean emailExiste(String email) {
        return usuarioRepository.existsByPersonaEmail(email);
    }

    @Override
    public boolean dniExiste(String dni) {
        return usuarioRepository.existsByPersonaNumeroDocumento(dni);
    }
}