import type { DatosCompraInsumo } from '../types/compraInsumos';
import { apiFetch } from '../../../config/api';

const API_BASE_URL = 'http://localhost:8080/api';

export const compraInsumosService = {
  registrarCompraInsumo: async (datos: DatosCompraInsumo): Promise<any> => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario || 1;

    const payload = {
      ...datos,
      idUsuario
    };

    const response = await apiFetch(`${API_BASE_URL}/compras-insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Error al registrar la compra de insumos');
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }
};