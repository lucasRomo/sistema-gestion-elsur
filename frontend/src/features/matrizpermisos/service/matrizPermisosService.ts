import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';
const BASE_URL = API_BASE_URL;

export interface ModuloPermiso {
  idPermiso: number;
  nombrePermiso: string;
  activo: boolean;
}

export interface Usuario {
  idUsuario: number;
  nombreUsuario: string;
  persona?: {
    nombre: string;
    apellido: string;
    email?: string;
  };
  rol?: {
    idRol: number;
    nombreRol: string;
  };
  tienePermisosPersonalizados?: boolean;
}

export const matrizPermisosService = {
  obtenerRoles: async () => {
    const res = await apiFetch(`${BASE_URL}/permisos/roles`);
    if (!res.ok) throw new Error('Error al obtener roles');
    const rolesData = await res.json();
    return rolesData.filter((r: any) => !r.nombreRol.startsWith('PERFIL_'));
  },

  obtenerPermisos: async () => {
    const res = await apiFetch(`${BASE_URL}/permisos`);
    if (!res.ok) throw new Error('Error al obtener la lista de permisos');
    return await res.json();
  },

  obtenerUsuarios: async (): Promise<Usuario[]> => {
    const res = await apiFetch(`${BASE_URL}/usuarios`);
    if (!res.ok) throw new Error('Error al obtener la lista de usuarios');
    return await res.json();
  },

  obtenerPermisosPorRol: async (idRol: number): Promise<number[]> => {
    const res = await apiFetch(`${BASE_URL}/permisos/rol/${idRol}`);
    if (!res.ok) throw new Error('Error al obtener permisos del rol');
    return await res.json();
  },

  crearRol: async (nombreRol: string) => {
    const res = await apiFetch(`${BASE_URL}/permisos/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreRol: nombreRol.toUpperCase() })
    });
    // BUG corregido: antes esto tiraba siempre 'Error al crear el perfil' sin
    // importar el motivo real (por ejemplo, un nombre duplicado ahora
    // rechazado por el backend con 409). extraerMensajeError lee el campo
    // "mensaje" del ApiError que arma GlobalExceptionHandler.
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al crear el perfil'));
    return await res.json();
  },

  eliminarRol: async (idRol: number) => {
    const res = await apiFetch(`${BASE_URL}/permisos/roles/${idRol}`, {
      method: 'DELETE'
    });
    // BUG corregido: leía "errorData.error", pero el backend (ver ApiError en
    // GlobalExceptionHandler) manda el texto pensado para mostrarse en el
    // campo "mensaje" -- "error" solo trae la frase genérica del status HTTP
    // ("Conflict", "Bad Request"). El motivo real (por ejemplo "no se puede
    // eliminar el perfil porque está asignado a uno o más usuarios activos")
    // nunca le llegaba al usuario.
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'No se pudo eliminar el perfil'));
    return true;
  },

  // Perfiles "PERFIL_<usuario>" sin ningún usuario asignado hoy -- quedaban
  // invisibles porque obtenerRoles() los filtra a propósito del selector de
  // perfiles globales. Esto es lo que permite verlos y limpiarlos.
  obtenerPerfilesHuerfanos: async () => {
    const res = await apiFetch(`${BASE_URL}/permisos/roles/huerfanos`);
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al obtener los perfiles huérfanos'));
    return await res.json();
  },

  actualizarUsuarioRol: async (idUsuario: number, payloadUsuario: any) => {
    const res = await apiFetch(`${BASE_URL}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadUsuario)
    });
    if (!res.ok) throw new Error('Error al actualizar el usuario');
    return res.ok;
  },

  actualizarPermisosRol: async (idRol: number, permisosIds: number[]) => {
    const res = await apiFetch(`${BASE_URL}/permisos/rol/${idRol}/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permisosIds)
    });
    if (!res.ok) throw new Error('Error al actualizar los permisos del rol');
    return res.ok;
  }
};