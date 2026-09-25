import type { DatosCompraInsumo } from '../types/compraInsumos';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';

const API_COMPRAS_INSUMOS = `${API_BASE_URL}/compras-insumos`;
const API_IA_ANALIZAR = `${API_BASE_URL}/ia/analizar-comprobante`;

export const compraInsumosService = {

  registrarCompraInsumo: async (datos: DatosCompraInsumo): Promise<any> => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

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
  },

  analizarComprobanteConIA: async (
    file: File,
    catalogos: { insumos: any[]; productos: any[] }
  ): Promise<any[]> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('catalogos', JSON.stringify(catalogos));

    const response = await apiFetch(API_IA_ANALIZAR, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al procesar la imagen en el servidor');
    }

    return data.items || [];
  }
};