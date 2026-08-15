// src/services/incidenciaService.ts
import type { Incidencia } from '../types/Incidencia';

const API_URL = 'http://localhost:8080/api/incidencias';

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
  /**
   * Obtiene las incidencias por máquina
   */
  getByMaquinaId: async (idMaquina: number): Promise<Incidencia[]> => {
    const res = await fetch(`${API_URL}/maquina/${idMaquina}`);
    if (!res.ok) {
      throw new Error(`Error al obtener incidencias: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Pone una incidencia en mantenimiento
   */
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

  /**
   * Resuelve una incidencia
   */
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

  /**
   * Registra un pago de mantenimiento
   */
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