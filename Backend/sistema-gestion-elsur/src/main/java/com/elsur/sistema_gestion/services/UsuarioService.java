package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioService {
    List<Usuario> listarTodos();
    Usuario guardar(Usuario usuario, Integer idUsuarioOperador);
    Usuario buscarPorId(Integer id);
    Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario);

    void cambiarPassword(Integer idUsuario, String passwordActual, String nuevaPassword);
    void cambiarNombreUsuario(Integer idUsuario, String usuarioActual, String usuarioNuevo);
    void cambiarEmail(Integer idUsuario, String emailActual, String emailNuevo);

    void restablecerPassword(Integer idUsuario, String nuevaPassword);

    void validarPermisoParaReasignarRol(Usuario usuarioAEditar, String nombreUsuarioOperador);

    boolean emailExiste(String email);
    boolean dniExiste(String dni);
    boolean usuarioExiste(String nombreUsuario);
}
