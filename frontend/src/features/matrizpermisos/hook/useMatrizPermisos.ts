import { useState, useEffect, useCallback } from 'react';
import { matrizPermisosService } from '../service/matrizPermisosService';
import type { ModuloPermiso, Usuario } from '../service/matrizPermisosService';

// Tiempo mínimo que se mantiene visible el spinner de carga, para que no
// desaparezca en un parpadeo cuando la consulta responde muy rápido.
const DURACION_MINIMA_SPINNER_MS = 400;

export const useMatrizPermisos = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number>(1);
  const [modulos, setModulos] = useState<ModuloPermiso[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const [rolSeleccionadoEnUsuario, setRolSeleccionadoEnUsuario] = useState<number | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState<string>('');
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState<boolean>(false);
  const [mostrarModalExito, setMostrarModalExito] = useState<boolean>(false);
  const [mensajeExitoTexto, setMensajeExitoTexto] = useState<string>('¡Guardado exitosamente!');

  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState<boolean>(false);
  const [mensajeBloqueoTexto, setMensajeBloqueoTexto] = useState<string>('');

  const [mostrarModalNuevoRol, setMostrarModalNuevoRol] = useState<boolean>(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState<string>('');

  const [mostrarModalConfirmarEliminarRol, setMostrarModalConfirmarEliminarRol] = useState<boolean>(false);

  const [perfilesHuerfanos, setPerfilesHuerfanos] = useState<any[]>([]);
  const [mostrarPerfilesHuerfanos, setMostrarPerfilesHuerfanos] = useState<boolean>(false);
  const [cargandoPerfilesHuerfanos, setCargandoPerfilesHuerfanos] = useState<boolean>(false);

  const fetchInicial = useCallback(async () => {
    setCargando(true);
    const inicio = Date.now();
    try {
      const [rolesData, permisosData, usuariosData, idsActivosAdmin] = await Promise.all([
        matrizPermisosService.obtenerRoles(),
        matrizPermisosService.obtenerPermisos(),
        matrizPermisosService.obtenerUsuarios(),
        matrizPermisosService.obtenerPermisosPorRol(1)
      ]);

      setRoles(rolesData);
      setUsuarios(usuariosData);

      const permisosBase = permisosData.map((p: any) => {
        const esProtegido = ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'].includes(p.nombrePermiso);

        return {
          idPermiso: p.idPermiso,
          nombrePermiso: p.nombrePermiso,
          activo: esProtegido ? true : idsActivosAdmin.includes(p.idPermiso)
        };
      });

      setModulos(permisosBase);
    } catch (error) {
      console.error('Error trayendo datos iniciales', error);
    } finally {
      const transcurrido = Date.now() - inicio;
      if (transcurrido < DURACION_MINIMA_SPINNER_MS) {
        await new Promise(resolve => setTimeout(resolve, DURACION_MINIMA_SPINNER_MS - transcurrido));
      }
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchInicial();
  }, [fetchInicial]);

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
        await matrizPermisosService.actualizarPermisosRol(rolSeleccionado, permisosActivosIds);
        idRolFinalAsignado = rolSeleccionado;

        setMensajeExitoTexto('¡Permisos de perfil global actualizados!');
      }

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
    const nombreNormalizado = nuevoRolNombre.trim().toUpperCase();
    if (roles.some(r => (r.nombreRol || '').toUpperCase() === nombreNormalizado)) {
      setMensajeBloqueoTexto('Ya existe un perfil con ese nombre.');
      setMostrarModalBloqueo(true);
      return;
    }
    try {
      const rolCreado = await matrizPermisosService.crearRol(nuevoRolNombre);
      await fetchInicial();
      setRolSeleccionado(rolCreado.idRol);
      setMostrarModalNuevoRol(false);
      setNuevoRolNombre('');
    } catch (error: any) {
      setMensajeBloqueoTexto(error?.message || 'Error al crear el perfil');
      setMostrarModalBloqueo(true);
    }
  };

  const cargarPerfilesHuerfanos = useCallback(async () => {
    setCargandoPerfilesHuerfanos(true);
    try {
      const data = await matrizPermisosService.obtenerPerfilesHuerfanos();
      setPerfilesHuerfanos(data);
    } catch (error) {
      console.error('Error al traer perfiles huérfanos', error);
    } finally {
      setCargandoPerfilesHuerfanos(false);
    }
  }, []);

  const alternarPerfilesHuerfanos = () => {
    setMostrarPerfilesHuerfanos(prev => {
      const nuevoValor = !prev;
      if (nuevoValor) cargarPerfilesHuerfanos();
      return nuevoValor;
    });
  };

  const eliminarPerfilHuerfano = async (idRol: number) => {
    try {
      await matrizPermisosService.eliminarRol(idRol);
      await cargarPerfilesHuerfanos();
      setMensajeExitoTexto('Perfil huérfano eliminado con éxito.');
      setMostrarModalExito(true);
    } catch (error: any) {
      setMensajeBloqueoTexto(error?.message || 'Error al eliminar el perfil huérfano.');
      setMostrarModalBloqueo(true);
    }
  };

  const handleEliminarRol = () => {
    if (rolSeleccionado === 1 || rolSeleccionado === 2) {
      setMensajeBloqueoTexto('No se pueden eliminar los perfiles principales del sistema.');
      setMostrarModalBloqueo(true);
      return;
    }

    setMostrarModalConfirmarEliminarRol(true);
  };

  const confirmarEliminarRol = async () => {
    setMostrarModalConfirmarEliminarRol(false);

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
    cargando,
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
    mostrarModalConfirmarEliminarRol,
    setMostrarModalConfirmarEliminarRol,
    perfilesHuerfanos,
    mostrarPerfilesHuerfanos,
    cargandoPerfilesHuerfanos,
    alternarPerfilesHuerfanos,
    eliminarPerfilHuerfano,
    togglePermiso,
    esPermisoProtegido,
    handleCambioPerfilSelect,
    seleccionarUsuarioParaPermisos,
    volverAModoGlobal,
    confirmarGuardado,
    handleCrearRol,
    handleEliminarRol,
    confirmarEliminarRol
  };
};
