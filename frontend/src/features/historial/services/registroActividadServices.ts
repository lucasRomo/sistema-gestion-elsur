import type { RegistroActividad } from '../types/RegistroActividad';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

// BUG corregido: esto tenía hardcodeado 'http://localhost:8080/api/registro-actividad'
// en vez de usar la misma API_BASE_URL compartida (config/api.ts, que respeta
// VITE_API_URL y solo cae a localhost:8080 como default de desarrollo). Como
// apiFetch no antepone la base a una URL que ya empieza con 'http', este
// service terminaba siempre pegándole a localhost:8080 sin importar en qué
// entorno corriera el resto de la app -- Historial de Actividad hubiera
// quedado roto en cualquier despliegue real, mientras el resto de los módulos
// (que sí usan API_BASE_URL) funcionaban normalmente.
export const getRegistrosActividad = async (): Promise<RegistroActividad[]> => {
  const response = await apiFetch(`${API_BASE_URL}/registro-actividad`);
  if (!response.ok) {
    throw new Error(await extraerMensajeError(response, 'Error al obtener el historial de actividades'));
  }
  return response.json();
};