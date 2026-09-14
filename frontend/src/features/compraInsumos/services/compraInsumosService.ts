import type { DatosCompraInsumo } from '../types/compraInsumos';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

const API_COMPRAS_INSUMOS = `${API_BASE_URL}/compras-insumos`;

export const compraInsumosService = {
  /**
   * Registra una compra de insumos/productos en el backend.
   */
  registrarCompraInsumo: async (datos: DatosCompraInsumo): Promise<any> => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario || 1;

    const payload = {
      ...datos,
      idUsuario
    };

    const response = await apiFetch(API_COMPRAS_INSUMOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al registrar la compra de insumos.'));
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }
};