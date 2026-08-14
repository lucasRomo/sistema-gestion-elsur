import { useState, useEffect, useCallback } from 'react';
import { matrizPermisosService } from '../service/matrizPermisosService';
import type { ModuloPermiso, Usuario } from '../service/matrizPermisosService';

export const useMatrizPermisos = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number>(1);
  const [modulos, setModulos] = useState<ModuloPermiso[]>([]);

  const [rolSeleccionadoEnUsuario, setRolSeleccionadoEnUsuario] = useState<number | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState<string>('');
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  // Modales y Alertas
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState<boolean>(false);
  const [mostrarModalExito, setMostrarModalExito] = useState<boolean>(false);
  const [mensajeExitoTexto, setMensajeExitoTexto] = useState<string>('¡Guardado exitosamente!');

  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState<boolean>(false);
  const [mensajeBloqueoTexto, setMensajeBloqueoTexto] = useState<string>('');

  const [mostrarModalNuevoRol, setMostrarModalNuevoRol] = useState<boolean>(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState<string>('');

  const fetchInicial = useCallback(async () => {
    try {
      const [rolesData, permisosData, usuariosData] = await Promise.all([
        matrizPermisosService.obtenerRoles(),
        matrizPermisosService.obtenerPermisos(),
        matrizPermisosService.obtenerUsuarios()
      ]);

      setRoles(rolesData);
      setUsuarios(usuariosData);

      const permisosBase = permisosData.map((p: any) => ({
        idPermiso: p.idPermiso,
        nombrePermiso: p.nombrePermiso,
        activo: false
      }));
      setModulos(permisosBase);
    } catch (error) {
      console.error('Error trayendo datos iniciales', error);
    }
  }, []);

  useEffect(() => {
    fetchInicial();
  }, [fetchInicial]);

  // Carga permisos al cambiar selección de Rol o Usuario
  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        let idRolAConsultar = rolSeleccionado;

        if (usuarioEditar) {
          if (rolSeleccionadoEnUsuario !== null) {
            idRolAConsultar = rolSeleccionadoEnUsuario;
          } else if (usuarioEditar.rol?.idRol) {
            idRolAConsultar = usuarioEditar.rol.idRol;
          } else {
            return;
          }
        }

        const idsActivos = await matrizPermisosService.obtenerPermisosPorRol(idRolAConsultar);
        const esRolAdminActivo = idRolAConsultar === 1;

        setModulos(prev => prev.map(mod => {
          const esProtegido = (esRolAdminActivo || usuarioEditar?.idUsuario === 1) &&
            ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'].includes(mod.nombrePermiso);

          return {
            ...mod,
            activo: esProtegido ? true : idsActivos.includes(mod.idPermiso)
          };
        }));
      } catch (error) {
        console.error('Error al traer permisos activos', error);
      }
    };

    if (modulos.length > 0) {
      fetchPermisos();
    }
  }, [rolSeleccionado, usuarioEditar, rolSeleccionadoEnUsuario]);

  const esPermisoProtegido = (nombrePermiso: string) => {
    const permisosProtegidos = ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'];
    if (!permisosProtegidos.includes(nombrePermiso)) return false;

    if (usuarioEditar) {
      return usuarioEditar.idUsuario === 1 || usuarioEditar.rol?.idRol === 1 || rolSeleccionadoEnUsuario === 1;
    }

    return rolSeleccionado === 1;
  };

  const togglePermiso = (id: number, nombrePermiso: string) => {
    if (esPermisoProtegido(nombrePermiso)) {
      setMensajeBloqueoTexto('Este permiso está protegido para el Perfil Administrador y no se puede desactivar.');
      setMostrarModalBloqueo(true);
      return;
    }

    setModulos(modulos.map(mod => mod.idPermiso === id ? { ...mod, activo: !mod.activo } : mod));
  };

  const handleCambioPerfilSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoRolId = Number(e.target.value);
    if (usuarioEditar) {
      setRolSeleccionadoEnUsuario(nuevoRolId);
    } else {
      setRolSeleccionado(nuevoRolId);
    }
  };

  const seleccionarUsuarioParaPermisos = (u: Usuario) => {
    setUsuarioEditar(u);
    setRolSeleccionadoEnUsuario(null);
  };

  const volverAModoGlobal = () => {
    setUsuarioEditar(null);
    setRolSeleccionadoEnUsuario(null);
  };

  const confirmarGuardado = async () => {
    setMostrarModalConfirmacion(false);

    const modulosAsegurados = modulos.map(mod => {
      if (esPermisoProtegido(mod.nombrePermiso)) {
        return { ...mod, activo: true };
      }
      return mod;
    });

    const permisosActivos = modulosAsegurados.filter(m => m.activo).map(m => ({
      idPermiso: m.idPermiso,
      nombrePermiso: m.nombrePermiso
    }));

    const permisosActivosIds = modulosAsegurados.filter(m => m.activo).map(m => m.idPermiso);

    try {
      let idRolFinalAsignado: number | undefined;

      if (usuarioEditar) {
        // CASO 1: Reasignación de Rol Global al Usuario
        if (rolSeleccionadoEnUsuario !== null) {
          const rolObjeto = roles.find(r => r.idRol === rolSeleccionadoEnUsuario);

          await matrizPermisosService.actualizarUsuarioRol(usuarioEditar.idUsuario, {
            ...usuarioEditar,
            rol: { idRol: rolSeleccionadoEnUsuario }
          });

          idRolFinalAsignado = rolSeleccionadoEnUsuario;
          const usuarioActualizado = {
            ...usuarioEditar,
            rol: rolObjeto || { idRol: rolSeleccionadoEnUsuario, nombreRol: 'ADMIN' },
            tienePermisosPersonalizados: false
          };
          setUsuarioEditar(usuarioActualizado);
          setMensajeExitoTexto(`¡Se asignó el perfil "${rolObjeto?.nombreRol || 'ADMIN'}" a ${usuarioEditar.nombreUsuario}!`);
        } 
        // CASO 2: Edición de permisos personalizados del usuario
        else {
          let idRolDestino = usuarioEditar.rol?.idRol;

          if (!usuarioEditar.rol?.nombreRol.startsWith('PERFIL_')) {
            const nombreNuevoPerfil = `PERFIL_${usuarioEditar.nombreUsuario.toUpperCase()}`;
            const rolCreado = await matrizPermisosService.crearRol(nombreNuevoPerfil);
            idRolDestino = rolCreado.idRol;

            await matrizPermisosService.actualizarUsuarioRol(usuarioEditar.idUsuario, {
              ...usuarioEditar,
              rol: { idRol: idRolDestino, nombreRol: nombreNuevoPerfil }
            });

            setUsuarioEditar(prev => prev ? { ...prev, rol: { idRol: idRolDestino!, nombreRol: nombreNuevoPerfil }, tienePermisosPersonalizados: true } : null);
          }

          if (idRolDestino) {
            await matrizPermisosService.actualizarPermisosRol(idRolDestino, permisosActivosIds);
            idRolFinalAsignado = idRolDestino;
          }

          setMensajeExitoTexto(`¡Permisos de ${usuarioEditar.nombreUsuario} actualizados!`);
        }
      } else {
        // CASO 3: Edición de la plantilla de Perfil Global
        await matrizPermisosService.actualizarPermisosRol(rolSeleccionado, permisosActivosIds);
        idRolFinalAsignado = rolSeleccionado;

        setMensajeExitoTexto('¡Permisos de perfil global actualizados!');
      }

      // Sincronización de sesión local y eventos
      const usuarioSesionString = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
      if (usuarioSesionString) {
        const usuarioSesion = JSON.parse(usuarioSesionString);
        
        const esMismoUsuario = usuarioEditar 
          ? (usuarioEditar.idUsuario === usuarioSesion.idUsuario)
          : (usuarioSesion.rol?.idRol === rolSeleccionado);

        if (esMismoUsuario) {
          usuarioSesion.permisos = permisosActivos;
          if (idRolFinalAsignado) {
            const rolInfo = roles.find(r => r.idRol === idRolFinalAsignado);
            usuarioSesion.rol = {
              idRol: idRolFinalAsignado,
              nombreRol: rolInfo ? rolInfo.nombreRol : (usuarioEditar?.rol?.nombreRol || usuarioSesion.rol?.nombreRol)
            };
          }

          localStorage.setItem('usuario_logueado', JSON.stringify(usuarioSesion));
          localStorage.setItem('usuario', JSON.stringify(usuarioSesion));

          window.dispatchEvent(new CustomEvent('permisos-actualizados', { detail: permisosActivos }));
          window.dispatchEvent(new Event('permisos-actualizados'));
          window.dispatchEvent(new Event('storage'));
        }
      }

      setRolSeleccionadoEnUsuario(null);
      setMostrarModalExito(true);
      await fetchInicial();
    } catch (error) {
      console.error(error);
      setMensajeBloqueoTexto('Error de conexión al guardar los datos');
      setMostrarModalBloqueo(true);
    }
  };

  const handleCrearRol = async () => {
    if (!nuevoRolNombre.trim()) {
      setMensajeBloqueoTexto('El nombre del perfil no puede estar vacío');
      setMostrarModalBloqueo(true);
      return;
    }
    try {
      const rolCreado = await matrizPermisosService.crearRol(nuevoRolNombre);
      await fetchInicial();
      setRolSeleccionado(rolCreado.idRol);
      setMostrarModalNuevoRol(false);
      setNuevoRolNombre('');
    } catch (error) {
      setMensajeBloqueoTexto('Error al crear el perfil');
      setMostrarModalBloqueo(true);
    }
  };

  const handleEliminarRol = async () => {
    if (rolSeleccionado === 1 || rolSeleccionado === 2) {
      setMensajeBloqueoTexto('No se pueden eliminar los perfiles principales del sistema.');
      setMostrarModalBloqueo(true);
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este perfil? Esta acción no se puede deshacer.')) return;

    try {
      await matrizPermisosService.eliminarRol(rolSeleccionado);
      setMensajeExitoTexto('Perfil eliminado con éxito.');
      setMostrarModalExito(true);
      await fetchInicial();
      setRolSeleccionado(1);
    } catch (error: any) {
      setMensajeBloqueoTexto(error.message || 'Error de conexión al intentar eliminar el perfil.');
      setMostrarModalBloqueo(true);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const completo = `${u.persona?.nombre || ''} ${u.persona?.apellido || ''} ${u.nombreUsuario}`.toLowerCase();
    return completo.includes(busquedaUsuario.toLowerCase());
  });

  const rolUsuarioEsPersonalizado = usuarioEditar?.rol?.nombreRol.startsWith('PERFIL_') || usuarioEditar?.tienePermisosPersonalizados;

  const valorSelectRol = usuarioEditar 
    ? (rolSeleccionadoEnUsuario !== null ? rolSeleccionadoEnUsuario : (usuarioEditar.rol?.idRol || ''))
    : rolSeleccionado;

  return {
    roles,
    rolSeleccionado,
    modulos,
    usuariosFiltrados,
    usuarioEditar,
    busquedaUsuario,
    setBusquedaUsuario,
    valorSelectRol,
    rolUsuarioEsPersonalizado,
    rolSeleccionadoEnUsuario,
    mostrarModalConfirmacion,
    setMostrarModalConfirmacion,
    mostrarModalExito,
    setMostrarModalExito,
    mensajeExitoTexto,
    mostrarModalBloqueo,
    setMostrarModalBloqueo,
    mensajeBloqueoTexto,
    mostrarModalNuevoRol,
    setMostrarModalNuevoRol,
    nuevoRolNombre,
    setNuevoRolNombre,
    togglePermiso,
    esPermisoProtegido,
    handleCambioPerfilSelect,
    seleccionarUsuarioParaPermisos,
    volverAModoGlobal,
    confirmarGuardado,
    handleCrearRol,
    handleEliminarRol
  };
};