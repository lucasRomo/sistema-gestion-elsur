package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Direccion;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.UsuarioService;
import com.elsur.sistema_gestion.services.CifradoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.elsur.sistema_gestion.services.RegistroActividadService;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.util.Objects;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private com.elsur.sistema_gestion.services.EmpleadoService empleadoService;

    @Autowired
    private RegistroActividadService registroActividadService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CifradoService cifradoService;

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
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

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

    @Override
    @Transactional
    public Usuario guardar(Usuario usuario, Integer idUsuarioOperador) {
        Optional<Usuario> existente = usuarioRepository.findByNombreUsuario(usuario.getNombreUsuario());
        if (existente.isPresent() && !existente.get().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new RecursoDuplicadoException("El nombre de usuario ya está en uso");
        }

        // Asignación de Rol / Primer Usuario
        if (usuarioRepository.count() == 0) {
            // Bootstrap real: el primer usuario del sistema nace ADMIN sin
            // importar qué rol haya llegado en el payload.
            Rol rolAdmin = new Rol();
            rolAdmin.setIdRol(1);
            usuario.setRol(rolAdmin);
        } else if (usuario.getIdUsuario() == null) {
            // Alta de un usuario nuevo (no el primero): antes, si el payload
            // traía un rol explícito (por ejemplo rol.idRol=1), se respetaba
            // tal cual -- y este endpoint es alcanzable tanto por alguien con
            // el permiso "Gestión de Usuarios" como, hasta hace un momento,
            // por el token del portón (ver MatrizSeguridadValidator). Eso
            // permitía crear un ADMIN nuevo en cualquier momento. Ahora toda
            // alta nace OPERARIO sin excepción; ascender a otro rol es un paso
            // aparte, vía PUT /api/usuarios/{id}, que exige el permiso
            // "Matriz de Permisos" en la matriz de seguridad.
            Rol rolEmpleado = new Rol();
            rolEmpleado.setIdRol(2);
            usuario.setRol(rolEmpleado);
        } else if (usuario.getRol() == null || usuario.getRol().getIdRol() == null) {
            // Edición de un usuario existente sin rol en el payload: se
            // conserva el rol que ya tenía en la base en vez de pisarlo con
            // OPERARIO (si no, cualquier ADMIN que se edite a sí mismo desde
            // un formulario que no reenvía su propio rol quedaría degradado).
            usuarioRepository.findById(usuario.getIdUsuario())
                    .map(Usuario::getRol)
                    .ifPresent(usuario::setRol);
        }
        // Caso restante: edición (idUsuario != null) con un rol explícito en
        // el payload -> se respeta. Es la reasignación de rol desde la Matriz
        // de Permisos, ya protegida por PUT /api/usuarios/{id} + permiso
        // "Matriz de Permisos".

        // --- CONTRASEÑA: hashear en el alta, conservar el hash existente en la edición ---
        // Este mismo endpoint (guardar) se usa tanto para crear como para editar un usuario.
        // - Alta (sin idUsuario): la contraseña llega en texto plano desde el formulario de
        //   registro -> se hashea acá con BCrypt antes de guardarla.
        // - Edición (con idUsuario): el formulario de edición de perfil no necesariamente manda
        //   la contraseña. Si acá se guardara "tal cual" lo que llega, un usuario.password nulo
        //   o vacío pisaría el hash guardado y rompería el login. El cambio de contraseña real
        //   tiene su propio endpoint (PUT /api/usuarios/{id}/password, ver cambiarPassword),
        //   así que en la edición general siempre se conserva el hash que ya estaba en la base.
        if (usuario.getIdUsuario() == null) {
            // Guardamos la copia reversible ANTES de pisar usuario.getPassword() con el
            // hash -- si el orden se invirtiera, cifraríamos el hash en vez de la
            // contraseña real que mandó el formulario de alta.
            usuario.setContrasenaVisible(cifradoService.encriptar(usuario.getPassword()));
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        } else {
            usuarioRepository.findById(usuario.getIdUsuario())
                    .ifPresent(actual -> {
                        usuario.setPassword(actual.getPassword());
                        usuario.setContrasenaVisible(actual.getContrasenaVisible());
                    });
        }

        // --- LÓGICA DE AUDITORÍA EN EDICIÓN ---
        if (usuario.getIdUsuario() != null && usuarioRepository.existsById(usuario.getIdUsuario())) {
            Usuario usuarioViejo = buscarPorId(usuario.getIdUsuario()); // Carga con campos transients rellenados

            if (usuarioViejo != null) {
                Usuario operadorActual = null;
                if (idUsuarioOperador != null) {
                    operadorActual = usuarioRepository.findById(idUsuarioOperador).orElse(null);
                }
                if (operadorActual == null) {
                    operadorActual = usuarioRepository.findAll().stream().findFirst().orElse(null);
                }

                // 1. Auditoría campos de Usuario
                compararYRegistrar(operadorActual, "Usuario", "nombreUsuario", usuario.getIdUsuario(),
                        usuarioViejo.getNombreUsuario(), usuario.getNombreUsuario());

                compararYRegistrar(operadorActual, "Usuario", "salario", usuario.getIdUsuario(),
                        usuarioViejo.getSalario(), usuario.getSalario());

                compararYRegistrar(operadorActual, "Usuario", "estado", usuario.getIdUsuario(),
                        usuarioViejo.getEstado(), usuario.getEstado());

                compararYRegistrar(operadorActual, "Usuario", "cargo", usuario.getIdUsuario(),
                        usuarioViejo.getCargo(), usuario.getCargo());

                // 2. Auditoría campos de Persona y Dirección asociada
                if (usuarioViejo.getPersona() != null && usuario.getPersona() != null) {
                    Persona pVieja = usuarioViejo.getPersona();
                    Persona pNueva = usuario.getPersona();

                    compararYRegistrar(operadorActual, "Persona", "nombre", usuario.getIdUsuario(),
                            pVieja.getNombre(), pNueva.getNombre());

                    compararYRegistrar(operadorActual, "Persona", "apellido", usuario.getIdUsuario(),
                            pVieja.getApellido(), pNueva.getApellido());

                    compararYRegistrar(operadorActual, "Persona", "numeroDocumento", usuario.getIdUsuario(),
                            pVieja.getNumeroDocumento(), pNueva.getNumeroDocumento());

                    compararYRegistrar(operadorActual, "Persona", "telefono", usuario.getIdUsuario(),
                            pVieja.getTelefono(), pNueva.getTelefono());

                    compararYRegistrar(operadorActual, "Persona", "email", usuario.getIdUsuario(),
                            pVieja.getEmail(), pNueva.getEmail());

                    // ⬇️ SECCIÓN AGREGADA: Auditoría de Dirección ⬇️
                    if (pVieja.getDireccion() != null && pNueva.getDireccion() != null) {
                        Direccion dVieja = pVieja.getDireccion();
                        Direccion dNueva = pNueva.getDireccion();

                        compararYRegistrar(operadorActual, "Direccion", "calle", usuario.getIdUsuario(),
                                dVieja.getCalle(), dNueva.getCalle());

                        compararYRegistrar(operadorActual, "Direccion", "numero", usuario.getIdUsuario(),
                                dVieja.getNumero(), dNueva.getNumero());

                        compararYRegistrar(operadorActual, "Direccion", "piso", usuario.getIdUsuario(),
                                dVieja.getPiso(), dNueva.getPiso());

                        compararYRegistrar(operadorActual, "Direccion", "departamento", usuario.getIdUsuario(),
                                dVieja.getDepartamento(), dNueva.getDepartamento());

                        compararYRegistrar(operadorActual, "Direccion", "codigoPostal", usuario.getIdUsuario(),
                                dVieja.getCodigoPostal(), dNueva.getCodigoPostal());

                        compararYRegistrar(operadorActual, "Direccion", "ciudad", usuario.getIdUsuario(),
                                dVieja.getCiudad(), dNueva.getCiudad());

                        compararYRegistrar(operadorActual, "Direccion", "provincia", usuario.getIdUsuario(),
                                dVieja.getProvincia(), dNueva.getProvincia());

                        compararYRegistrar(operadorActual, "Direccion", "pais", usuario.getIdUsuario(),
                                dVieja.getPais(), dNueva.getPais());
                    }
                }
            }
        }

        // Guardamos el usuario
        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Sincronización en tabla Empleado
        if (usuario.getSalario() != null && usuarioGuardado.getPersona() != null) {
            Integer idPersonaBuscada = usuarioGuardado.getPersona().getIdPersona();

            Optional<com.elsur.sistema_gestion.models.Empleado> empleadoExistente = empleadoService.listarTodos().stream()
                .filter(emp -> emp.getPersona() != null && emp.getPersona().getIdPersona() != null &&
                               emp.getPersona().getIdPersona().equals(idPersonaBuscada))
                .findFirst();

            com.elsur.sistema_gestion.models.Empleado empleado;

            if (empleadoExistente.isPresent()) {
                empleado = empleadoExistente.get();
            } else {
                empleado = new com.elsur.sistema_gestion.models.Empleado();
                empleado.setPersona(usuarioGuardado.getPersona());
                empleado.setFechaContratacion(java.time.LocalDate.now());
            }

            empleado.setSalario(usuario.getSalario());
            empleado.setCargo(usuario.getCargo() != null && !usuario.getCargo().isEmpty() ? usuario.getCargo() : "Empleado");
            empleado.setEstado(usuario.getEstado() != null ? usuario.getEstado() : "Activo");

            empleadoService.guardar(empleado);
        }

        return usuarioGuardado;
    }

    @Override
    @Transactional
    public void cambiarPassword(Integer idUsuario, String passwordActual, String nuevaPassword) {
        Usuario user = buscarPorId(idUsuario);

        // Antes esta operación aceptaba la contraseña nueva sin comprobar que quien la pedía
        // conociera la actual. Con BCrypt, matches() recalcula el hash de passwordActual con el
        // salt guardado en user.getPassword() y los compara: si no coincide, no se toca nada.
        if (passwordActual == null || !passwordEncoder.matches(passwordActual, user.getPassword())) {
            throw new SolicitudInvalidaException("La contraseña actual no coincide.");
        }

        user.setPassword(passwordEncoder.encode(nuevaPassword));
        user.setContrasenaVisible(cifradoService.encriptar(nuevaPassword));
        usuarioRepository.save(user);
    }

    @Override
    @Transactional
    public void cambiarNombreUsuario(Integer idUsuario, String usuarioActual, String usuarioNuevo) {
        Usuario user = buscarPorId(idUsuario);

        if (usuarioActual == null || !user.getNombreUsuario().equalsIgnoreCase(usuarioActual.trim())) {
            throw new SolicitudInvalidaException("El nombre de usuario actual no coincide.");
        }

        if (usuarioExiste(usuarioNuevo) && !user.getNombreUsuario().equalsIgnoreCase(usuarioNuevo.trim())) {
            throw new RecursoDuplicadoException("El nuevo nombre de usuario ya está en uso.");
        }

        // Registrar cambio en auditoría
        compararYRegistrar(user, "Usuario", "nombreUsuario", idUsuario, user.getNombreUsuario(), usuarioNuevo);

        user.setNombreUsuario(usuarioNuevo);
        usuarioRepository.save(user);
    }

    @Override
    @Transactional
    public void cambiarEmail(Integer idUsuario, String emailActual, String emailNuevo) {
        Usuario user = buscarPorId(idUsuario);

        if (user.getPersona() == null) {
            throw new SolicitudInvalidaException("El usuario no tiene una persona asociada.");
        }

        String actualEnBD = user.getPersona().getEmail();
        if (actualEnBD == null || !actualEnBD.equalsIgnoreCase(emailActual.trim())) {
            throw new SolicitudInvalidaException("El email actual no coincide.");
        }

        if (emailExiste(emailNuevo) && !actualEnBD.equalsIgnoreCase(emailNuevo.trim())) {
            throw new RecursoDuplicadoException("El nuevo email ya está registrado por otro usuario.");
        }

        // Registrar cambio en auditoría
        compararYRegistrar(user, "Persona", "email", idUsuario, actualEnBD, emailNuevo);

        user.getPersona().setEmail(emailNuevo);
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

    private void compararYRegistrar(Usuario usuarioOperador, String tabla, String columna, Integer idReg, Object viejoVal, Object nuevoVal) {
        if (viejoVal == null && nuevoVal == null) return;

        boolean sonIguales = false;

        if (viejoVal instanceof Number || nuevoVal instanceof Number) {
            try {
                BigDecimal bdViejo = viejoVal != null ? new BigDecimal(viejoVal.toString()) : BigDecimal.ZERO;
                BigDecimal bdNuevo = nuevoVal != null ? new BigDecimal(nuevoVal.toString()) : BigDecimal.ZERO;
                sonIguales = bdViejo.compareTo(bdNuevo) == 0;
            } catch (Exception e) {
                sonIguales = Objects.equals(viejoVal, nuevoVal);
            }
        } else {
            String stringViejo = viejoVal != null ? viejoVal.toString().trim() : "";
            String stringNuevo = nuevoVal != null ? nuevoVal.toString().trim() : "";
            sonIguales = Objects.equals(stringViejo, stringNuevo);
        }

        if (!sonIguales) {
            registroActividadService.registrarCambio(
                usuarioOperador,
                "UPDATE",
                tabla,
                columna,
                idReg,
                viejoVal != null ? viejoVal.toString() : "",
                nuevoVal != null ? nuevoVal.toString() : ""
            );
        }
    }
}
