import type { Incidencia } from '../types/Incidencia';
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/incidencias`;

export interface PagoMantenimientoDTO {
  monto: number;
  metodoPago: string;
  descripcion: string;
  idUsuario: number;
  forzarSaldoInsuficiente?: boolean;
}

export interface RespuestaPago {
  code?: string;
  message?: string;
  [key: string]: any;
}

export const incidenciaService = {
  getByMaquinaId: async (idMaquina: number): Promise<Incidencia[]> => {
    const res = await fetch(`${API_URL}/maquina/${idMaquina}`);
    if (!res.ok) {
      throw new Error(`Error al obtener incidencias: ${res.statusText}`);
    }
    return res.json();
  },

  ponerEnMantenimiento: async (
    idIncidencia: number, 
    notaMantenimiento: string, 
    idEmpleadoMantenimiento: number
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/${idIncidencia}/mantenimiento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notaMantenimiento, idEmpleadoMantenimiento })
    });

    if (!res.ok) {
      throw new Error('Error al cambiar estado a mantenimiento');
    }
  },

  resolver: async (
    idIncidencia: number, 
    resolucion: string, 
    idEmpleadoResuelve: number
  ): Promise<void> => {
    const res = await fetch(`${API_URL}/${idIncidencia}/resolver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolucion, idEmpleadoResuelve })
    });

    if (!res.ok) {
      throw new Error('Error al resolver la incidencia');
    }
  },

  registrarPagoMantenimiento: async (
    idIncidencia: number, 
    payload: PagoMantenimientoDTO
  ): Promise<{ ok: boolean; data: RespuestaPago }> => {
    const res = await fetch(`${API_URL}/${idIncidencia}/pago-mantenimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data: RespuestaPago = await res.json();
    return { ok: res.ok, data };
  }
};