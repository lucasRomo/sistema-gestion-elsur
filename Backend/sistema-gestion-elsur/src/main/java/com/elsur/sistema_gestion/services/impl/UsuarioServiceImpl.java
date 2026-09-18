package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Direccion;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.UsuarioService;
import com.elsur.sistema_gestion.services.CifradoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
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

    @Autowired
    private RolRepository rolRepository;

    // Nombre exacto del permiso que habilita reasignar roles desde la Matriz de
    // Permisos. Se compara ignorando mayúsculas/minúsculas, igual que el resto
    // de las comparaciones de nombres de permiso en el proyecto.
    private static final String PERMISO_MATRIZ_DE_PERMISOS = "Matriz de Permisos";
    private static final Integer ID_ROL_ADMIN = 1;
    private static final Integer ID_USUARIO_ADMIN_PRINCIPAL = 1;

    private boolean rolTienePermiso(Rol rol, String nombrePermiso) {
        return rol != null && rol.getPermisos() != null &&
                rol.getPermisos().stream().anyMatch(p -> nombrePermiso.equalsIgnoreCase(p.getNombrePermiso()));
    }

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

        // TC_22: antes esto no se validaba acá -- la única barrera contra un DNI
        // duplicado era la restricción UNIQUE de la columna numero_documento en la
        // base. Eso funcionaba, pero al reventar como DataIntegrityViolationException
        // sin ningún catch propio, terminaba en el @ExceptionHandler(RuntimeException.class)
        // genérico (400, con el mensaje crudo de Hibernate/Postgres) en vez de un 409
        // con un mensaje pensado para el usuario. Mismo patrón que el chequeo de
        // nombreUsuario de arriba: se busca por DNI y se compara el idUsuario para no
        // romper la edición de la propia persona (si no, cualquiera que edite su
        // propio perfil sin cambiar el DNI se vería a sí mismo como "duplicado").
        if (usuario.getPersona() != null && usuario.getPersona().getNumeroDocumento() != null) {
            Optional<Usuario> existentePorDni = usuarioRepository.findByPersonaNumeroDocumento(
                    usuario.getPersona().getNumeroDocumento());
            if (existentePorDni.isPresent() && !existentePorDni.get().getIdUsuario().equals(usuario.getIdUsuario())) {
                throw new RecursoDuplicadoException("Ya existe una persona registrada con ese número de documento");
            }
        }

        // GAP corregido: a diferencia de CambioPasswordDTO (@Size min=8, max=72)
        // para el cambio de contraseña de un usuario ya existente, el alta (esta
        // misma entidad Usuario cruda, sin un DTO propio con @Valid) no exigía
        // ningún largo mínimo -- se podía crear una cuenta con contraseña vacía
        // o de un solo carácter. Se valida acá, a mano, en vez de agregar
        // @Size directo en el campo de la entidad (eso hubiera afectado también
        // a Hibernate con ddl-auto=update, arriesgando una alteración de columna
        // no planeada). Solo aplica al alta: la edición general nunca manda
        // password (se conserva el hash existente, ver más abajo), y el login
        // tiene su propia validación de credenciales que no debe rechazar
        // contraseñas históricas más cortas que este mínimo.
        if (usuario.getIdUsuario() == null) {
            String passwordPlano = usuario.getPassword();
            if (passwordPlano == null || passwordPlano.length() < 8 || passwordPlano.length() > 72) {
                throw new SolicitudInvalidaException("La contraseña debe tener entre 8 y 72 caracteres.");
            }
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
        } else {
            // Caso restante: edición (idUsuario != null) con un rol explícito en
            // el payload -> se respeta. Es la reasignación de rol desde la
            // Matriz de Permisos, ya protegida por PUT /api/usuarios/{id} +
            // permiso "Matriz de Permisos" (ver validarPermisoParaReasignarRol,
            // llamado por el controller ANTES de este método).
            //
            // GAP corregido: hasta ahora nada impedía reasignar al usuario ID 1
            // (el admin de arranque del sistema) a un rol sin el permiso
            // "Matriz de Permisos". Si eso pasara y ningún otro usuario activo
            // tuviera ese permiso, nadie podría volver a entrar a este módulo
            // para revertirlo -- un bloqueo total y potencialmente irreversible.
            // PermisoServiceImpl.actualizarPermisosRol ya protege el CONJUNTO DE
            // PERMISOS del rol cuyo id es 1, pero eso no alcanza si al usuario 1
            // se lo cambia a un rol DISTINTO (por ejemplo, a OPERARIO). Este
            // chequeo cubre justo ese caso.
            if (ID_USUARIO_ADMIN_PRINCIPAL.equals(usuario.getIdUsuario())) {
                Rol rolDestino = rolRepository.findById(usuario.getRol().getIdRol()).orElse(null);
                if (!rolTienePermiso(rolDestino, PERMISO_MATRIZ_DE_PERMISOS)) {
                    throw new SolicitudInvalidaException(
                        "No se puede reasignar al usuario administrador principal (ID 1) a un perfil sin el " +
                        "permiso 'Matriz de Permisos': nadie podría volver a entrar a este módulo para revertirlo.");
                }
            }
        }

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
        //
        // GAP corregido (parcialmente): el chequeo de DNI duplicado de más arriba
        // (findByPersonaNumeroDocumento) cierra el caso normal, pero deja una
        // ventana de carrera real -- dos altas simultáneas con el mismo DNI
        // pueden pasar ambas ese chequeo antes de que cualquiera de las dos
        // llegue a este save(). Antes, quien perdía la carrera chocaba contra el
        // UNIQUE de la base con un DataIntegrityViolationException que nadie
        // traducía, y terminaba como 400 con el mensaje crudo de Postgres (ver
        // GlobalExceptionHandler.handleRuntimeException). Esto no elimina la
        // ventana de carrera en sí (eso requeriría aislamiento de transacción a
        // nivel de base, fuera del alcance de esta corrección), pero sí asegura
        // que el resultado observable sea siempre el mismo 409 prolijo,
        // independientemente del timing.
        Usuario usuarioGuardado;
        try {
            usuarioGuardado = usuarioRepository.save(usuario);
        } catch (DataIntegrityViolationException e) {
            throw new RecursoDuplicadoException(
                "Ya existe un usuario o una persona registrada con esos datos (nombre de usuario o número de documento).");
        }

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

    // NUEVO: reseteo de contraseña por un ADMIN. A diferencia de cambiarPassword
    // (que exige conocer la contraseña ACTUAL del usuario objetivo -- pensado
    // para que alguien cambie su propia contraseña), este método no le pide
    // nada al usuario objetivo: la reautenticación es del ADMIN que lo pide, y
    // ya se validó en el controller (mismo criterio que verContrasenaReal)
    // antes de llegar acá. Esto es lo que le faltaba a "Gestión de Usuarios"
    // para poder cambiar la contraseña de otro usuario de verdad -- antes solo
    // existía la consulta ("Ver contraseña").
    @Override
    @Transactional
    public void restablecerPassword(Integer idUsuario, String nuevaPassword) {
        Usuario user = buscarPorId(idUsuario);
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

    // NUEVO: valida que reasignar el rol de "usuarioAEditar" esté autorizado
    // para quien lo está pidiendo de verdad (nombreUsuarioOperador viene de
    // Authentication.getName(), no del parámetro "idUsuario" de la query, que
    // es un dato que manda el cliente sin validar contra nada -- confiar en
    // ese parámetro para autorizar hubiera sido tan fácil de saltear como
    // mandar cualquier id ajeno).
    //
    // GAP corregido: MatrizSeguridadValidator mapea CUALQUIER ruta
    // /api/usuarios/** (incluido este mismo PUT) al permiso genérico "Gestión
    // de Usuarios" como regla de respaldo, además de la regla específica para
    // "Matriz de Permisos". Como guardar() respeta cualquier "rol" que venga
    // en el payload de una edición, el resultado era que el permiso "Gestión
    // de Usuarios" -- pensado para administrar legajos/datos de empleados --
    // también alcanzaba, en la práctica, para reasignar el rol de cualquier
    // usuario (incluso a ADMIN) armando el pedido a mano. Este chequeo cierra
    // ese hueco a nivel de service, sin tocar la regla de autorización por
    // ruta (que no puede leer el cuerpo del pedido).
    @Override
    public void validarPermisoParaReasignarRol(Usuario usuarioAEditar, String nombreUsuarioOperador) {
        if (usuarioAEditar == null || usuarioAEditar.getIdUsuario() == null ||
                usuarioAEditar.getRol() == null || usuarioAEditar.getRol().getIdRol() == null) {
            return; // el payload no trae un rol explícito -> no es una reasignación
        }

        Usuario actual = usuarioRepository.findById(usuarioAEditar.getIdUsuario()).orElse(null);
        if (actual == null || actual.getRol() == null ||
                actual.getRol().getIdRol().equals(usuarioAEditar.getRol().getIdRol())) {
            return; // no había rol previo, o el rol pedido es el mismo que ya tenía -> no es una reasignación real
        }

        Usuario operador = nombreUsuarioOperador != null
                ? usuarioRepository.findByNombreUsuario(nombreUsuarioOperador).orElse(null)
                : null;

        boolean esAdmin = operador != null && operador.getRol() != null &&
                ID_ROL_ADMIN.equals(operador.getRol().getIdRol());
        boolean tienePermisoMatriz = operador != null && rolTienePermiso(operador.getRol(), PERMISO_MATRIZ_DE_PERMISOS);

        if (!esAdmin && !tienePermisoMatriz) {
            throw new AccessDeniedException(
                "Solo un usuario con el permiso 'Matriz de Permisos' puede reasignar el rol de otro usuario.");
        }
    }

    // GAP corregido (defensa en profundidad): a diferencia de RolServiceImpl.eliminar
    // (que bloquea los roles 1/2), este método no tenía ninguna protección --
    // ni siquiera para el usuario ID 1 (el admin de arranque). Hoy no es
    // explotable porque UsuarioController no expone ningún @DeleteMapping que
    // llame a esto, pero se agrega la misma barrera igual, para que quede
    // protegido desde ya si en el futuro alguien agrega ese endpoint sin
    // revisar este método primero.
    @Override
    @Transactional
    public void eliminar(Integer id) {
        if (ID_USUARIO_ADMIN_PRINCIPAL.equals(id)) {
            throw new SolicitudInvalidaException("No se puede eliminar al usuario administrador principal del sistema.");
        }
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
