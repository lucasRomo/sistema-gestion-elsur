package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioService {
    List<Usuario> listarTodos();
    Usuario guardar(Usuario usuario, Integer idUsuarioOperador);
    Usuario buscarPorId(Integer id);
    Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario);
    void eliminar(Integer id);
    void cambiarPassword(Integer idUsuario, String nuevaPassword);
    void cambiarNombreUsuario(Integer idUsuario, String usuarioActual, String usuarioNuevo);
    void cambiarEmail(Integer idUsuario, String emailActual, String emailNuevo);

    boolean emailExiste(String email);
    boolean dniExiste(String dni);
    boolean usuarioExiste(String nombreUsuario);
}