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
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

    // CORREGIDO: antes, si no se detectaba un usuario logueado en localStorage,
    // la compra se atribuía en silencio al usuario ID 1 (probablemente el
    // admin/primer usuario creado) -- el mismo bug ya corregido en
    // useCaja.ts/ModalMermasInsumos.tsx/ModalMermasProductos.tsx. Ahora se
    // rechaza la operación en vez de falsear la autoría del movimiento de
    // caja que genera la compra.
    if (!idUsuario) {
      throw new Error('No se detectó un usuario logueado activo. Vuelva a iniciar sesión antes de registrar la compra.');
    }

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