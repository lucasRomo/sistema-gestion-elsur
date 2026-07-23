package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Rol;
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

    @Autowired
    private com.elsur.sistema_gestion.services.EmpleadoService empleadoService;



    @Override
public List<Usuario> listarTodos() {
    List<Usuario> usuarios = usuarioRepository.findAll();
    
    for (Usuario u : usuarios) {
        if (u.getPersona() != null && u.getPersona().getIdPersona() != null) {
            Integer idPersonaBuscada = u.getPersona().getIdPersona();
            
            empleadoService.listarTodos().stream()
                .filter(emp -> emp.getPersona() != null && emp.getPersona().getIdPersona() != null && 
                               emp.getPersona().getIdPersona().equals(idPersonaBuscada))
                .findFirst()
                .ifPresent(empleado -> {
                    u.setSalario(empleado.getSalario());
                    u.setEstado(empleado.getEstado());
                    u.setCargo(empleado.getCargo()); 
                });
        }
    }
    return usuarios;
}




    @Override
public Usuario buscarPorId(Integer id) {
    Usuario u = usuarioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
    if (u.getPersona() != null && u.getPersona().getIdPersona() != null) {
        Integer idPersonaBuscada = u.getPersona().getIdPersona();
        
        empleadoService.listarTodos().stream()
            .filter(emp -> emp.getPersona() != null && emp.getPersona().getIdPersona() != null && 
                           emp.getPersona().getIdPersona().equals(idPersonaBuscada))
            .findFirst()
            .ifPresent(empleado -> {
                u.setSalario(empleado.getSalario());
                u.setEstado(empleado.getEstado());
                u.setCargo(empleado.getCargo()); 
            });
    }
    return u;
}




    @Override
    public Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario);
    }




//eSTO

    @Override
    @Transactional
    public Usuario guardar(Usuario usuario) {
        // Validación de nombre de usuario existente
        Optional<Usuario> existente = usuarioRepository.findByNombreUsuario(usuario.getNombreUsuario());
        if (existente.isPresent() && !existente.get().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        // --- NUEVA LÓGICA: Asignación de Rol por defecto / Primer Usuario ---
        if (usuarioRepository.count() == 0) {
            Rol rolAdmin = new Rol();
            rolAdmin.setIdRol(1); // Asegurate que el ID 1 corresponde a ADMIN en tu BD
            usuario.setRol(rolAdmin);
        } else if (usuario.getRol() == null || usuario.getRol().getIdRol() == null) {
            Rol rolEmpleado = new Rol();
            rolEmpleado.setIdRol(2); // Asegurate que el ID 2 corresponde a EMPLEADO en tu BD
            usuario.setRol(rolEmpleado);
        }
        // ---------------------------------------------------------------------

        // 1. Guardamos el usuario (esto actualiza Persona por cascada)
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // 2. Sincronizamos el salario y estado en la tabla Empleado de forma ultra-segura
        if (usuario.getSalario() != null && usuarioGuardado.getPersona() != null) {
            
            Integer idPersonaBuscada = usuarioGuardado.getPersona().getIdPersona();

            // Buscamos comparando estrictamente el ID numérico de la persona
            Optional<com.elsur.sistema_gestion.models.Empleado> empleadoExistente = empleadoService.listarTodos().stream()
                .filter(emp -> emp.getPersona() != null && emp.getPersona().getIdPersona() != null && 
                               emp.getPersona().getIdPersona().equals(idPersonaBuscada))
                .findFirst();

            com.elsur.sistema_gestion.models.Empleado empleado;

            if (empleadoExistente.isPresent()) {
                // Si ya existía, usamos ese mismo registro para actualizarlo (NO creamos uno nuevo)
                empleado = empleadoExistente.get();
            } else {
                // Si es un usuario nuevo de verdad, creamos su registro de empleado por única vez
                empleado = new com.elsur.sistema_gestion.models.Empleado();
                empleado.setPersona(usuarioGuardado.getPersona());
                empleado.setFechaContratacion(java.time.LocalDate.now());
            }

            // Asignamos los datos reales del JSON
            empleado.setSalario(usuario.getSalario());
            empleado.setCargo(usuario.getCargo() != null && !usuario.getCargo().isEmpty() ? usuario.getCargo() : "Empleado");
            
            // Tomamos el estado real elegido en el modal ("Activo" o "Desactivado")
            empleado.setEstado(usuario.getEstado() != null ? usuario.getEstado() : "Activo");

            // Guardamos el registro consolidado
            empleadoService.guardar(empleado);
        }

        return usuarioGuardado;
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

    @Override
    public boolean usuarioExiste(String nombreUsuario) {
    return usuarioRepository.findByNombreUsuario(nombreUsuario).isPresent();
}
}