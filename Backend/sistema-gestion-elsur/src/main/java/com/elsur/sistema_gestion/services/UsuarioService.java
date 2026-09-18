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
    // Antes: cambiarPassword(Integer idUsuario, String nuevaPassword) — cualquiera que supiera
    // el id de otro usuario podía llamarla sin probar que conocía la contraseña actual.
    // Ahora exige passwordActual y el service la valida con BCrypt antes de aceptar el cambio.
    void cambiarPassword(Integer idUsuario, String passwordActual, String nuevaPassword);
    void cambiarNombreUsuario(Integer idUsuario, String usuarioActual, String usuarioNuevo);
    void cambiarEmail(Integer idUsuario, String emailActual, String emailNuevo);

    // NUEVO: reseteo de contraseña por un ADMIN, sin necesitar la contraseña
    // actual del usuario objetivo (a diferencia de cambiarPassword). La
    // reautenticación del admin (passwordAdmin + chequeo de rol) se hace en el
    // controller, igual que ya hace verContrasenaReal -- acá solo se aplica el
    // cambio una vez que el controller ya validó que quien pide esto es admin.
    void restablecerPassword(Integer idUsuario, String nuevaPassword);

    // NUEVO: valida que reasignar el rol de "usuarioAEditar" (si el payload
    // trae un rol explícito y distinto al que ya tiene en la base) esté
    // autorizado -- el que opera debe ser ADMIN o tener el permiso "Matriz de
    // Permisos". No hace nada si el payload no incluye un cambio de rol real.
    // Se verifica acá (contra el Authentication real del pedido) porque
    // MatrizSeguridadValidator solo sabe autorizar por RUTA + MÉTODO, no puede
    // distinguir "edición común" de "reasignación de rol" dentro del mismo
    // PUT /api/usuarios/{id} sin leer el cuerpo del pedido.
    void validarPermisoParaReasignarRol(Usuario usuarioAEditar, String nombreUsuarioOperador);

    boolean emailExiste(String email);
    boolean dniExiste(String dni);
    boolean usuarioExiste(String nombreUsuario);
}
