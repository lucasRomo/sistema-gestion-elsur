import type { RegistroActividad } from '../types/RegistroActividad';

const API_BASE_URL = 'http://localhost:8080/api/registro-actividad';

export const getRegistrosActividad = async (): Promise<RegistroActividad[]> => {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Error al obtener el historial de actividades');
  }
  return response.json();
};