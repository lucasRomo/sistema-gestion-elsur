const BASE_URL = 'http://localhost:8080/api';

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
    const res = await fetch(`${BASE_URL}/permisos/roles`);
    if (!res.ok) throw new Error('Error al obtener roles');
    const rolesData = await res.json();
    return rolesData.filter((r: any) => !r.nombreRol.startsWith('PERFIL_'));
  },

  obtenerPermisos: async () => {
    const res = await fetch(`${BASE_URL}/permisos`);
    if (!res.ok) throw new Error('Error al obtener la lista de permisos');
    return await res.json();
  },

  obtenerUsuarios: async (): Promise<Usuario[]> => {
    const res = await fetch(`${BASE_URL}/usuarios`);
    if (!res.ok) throw new Error('Error al obtener la lista de usuarios');
    return await res.json();
  },

  obtenerPermisosPorRol: async (idRol: number): Promise<number[]> => {
    const res = await fetch(`${BASE_URL}/permisos/rol/${idRol}`);
    if (!res.ok) throw new Error('Error al obtener permisos del rol');
    return await res.json();
  },

  crearRol: async (nombreRol: string) => {
    const res = await fetch(`${BASE_URL}/permisos/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreRol: nombreRol.toUpperCase() })
    });
    if (!res.ok) throw new Error('Error al crear el perfil');
    return await res.json();
  },

  eliminarRol: async (idRol: number) => {
    const res = await fetch(`${BASE_URL}/permisos/roles/${idRol}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'No se pudo eliminar el perfil');
    }
    return true;
  },

  actualizarUsuarioRol: async (idUsuario: number, payloadUsuario: any) => {
    const res = await fetch(`${BASE_URL}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadUsuario)
    });
    if (!res.ok) throw new Error('Error al actualizar el usuario');
    return res.ok;
  },

  actualizarPermisosRol: async (idRol: number, permisosIds: number[]) => {
    const res = await fetch(`${BASE_URL}/permisos/rol/${idRol}/actualizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permisosIds)
    });
    if (!res.ok) throw new Error('Error al actualizar los permisos del rol');
    return res.ok;
  }
};