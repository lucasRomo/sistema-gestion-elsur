import type { RegistroActividad } from '../types/RegistroActividad';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

export const getRegistrosActividad = async (): Promise<RegistroActividad[]> => {
  const response = await apiFetch(`${API_BASE_URL}/registro-actividad`);
  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, 'Error al obtener el historial de actividades'));
  }
  return response.json();
};