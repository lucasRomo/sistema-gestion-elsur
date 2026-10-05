import type { RegistroActividad } from '../types/RegistroActividad';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

export interface UsuarioConActividad {
  idUsuario: number;
  nombre: string;
}

interface FiltrosActividad {
  tabla: string;
  idUsuario: number | null;
}

const armarParams = ({ tabla, idUsuario }: FiltrosActividad) => {
  const params = new URLSearchParams();
  if (tabla.trim()) params.set('tabla', tabla.trim());
  if (idUsuario != null) params.set('idUsuario', String(idUsuario));
  return params;
};

// Lista completa con los filtros aplicados: solo para exportar a Excel/PDF.
export const getRegistrosActividad = async (filtros: FiltrosActividad): Promise<RegistroActividad[]> => {
  const response = await apiFetch(`${API_BASE_URL}/registro-actividad?${armarParams(filtros).toString()}`, {
    forceLoading: true,
    loadingMessage: 'Preparando la exportación...',
  });
  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, 'Error al obtener el historial de actividades'));
  }
  return response.json();
};

export const getRegistrosActividadPaginado = async (
  filtros: FiltrosActividad & { pagina: number; tamano: number }
): Promise<{ contenido: RegistroActividad[]; totalElementos: number; ultima: boolean }> => {
  const params = armarParams(filtros);
  params.set('pagina', String(filtros.pagina));
  params.set('tamano', String(filtros.tamano));
  const response = await apiFetch(`${API_BASE_URL}/registro-actividad/paginado?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, 'Error al obtener el historial de actividades'));
  }
  return response.json();
};

export const getUsuariosConActividad = async (): Promise<UsuarioConActividad[]> => {
  const response = await apiFetch(`${API_BASE_URL}/registro-actividad/usuarios`);
  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, 'Error al obtener los usuarios del historial'));
  }
  return response.json();
};
