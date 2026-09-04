import type { RegistroActividad } from '../types/RegistroActividad';
import { apiFetch } from '../../../config/api';

const API_BASE_URL = 'http://localhost:8080/api/registro-actividad';

export const getRegistrosActividad = async (): Promise<RegistroActividad[]> => {
  const response = await apiFetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Error al obtener el historial de actividades');
  }
  return response.json();
};