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
    payload: PagoMantenimientoDTO,
    comprobanteFile?: File | null
  ): Promise<{ ok: boolean; data: RespuestaPago }> => {
    
    const formData = new FormData();
    formData.append("monto", payload.monto.toString());
    formData.append("metodoPago", payload.metodoPago);
    formData.append("descripcion", payload.descripcion);
    formData.append("idUsuario", payload.idUsuario.toString());
    formData.append("forzarSaldoInsuficiente", String(payload.forzarSaldoInsuficiente ?? false));

    if (comprobanteFile) {
      formData.append("comprobante", comprobanteFile);
    }

    const res = await fetch(`${API_URL}/${idIncidencia}/pago-mantenimiento`, {
      method: 'POST',
      body: formData
    });

    const data: RespuestaPago = await res.json();
    return { ok: res.ok, data };
  }
};