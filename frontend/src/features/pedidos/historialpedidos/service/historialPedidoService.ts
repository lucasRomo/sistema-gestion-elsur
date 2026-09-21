import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../../config/api';

const API_URL = `${API_BASE_URL}/pedidos`;

export const historialPedidoService = {
  obtenerPorId: async (idPedido: number): Promise<any> => {
    const response = await apiFetch(`${API_URL}/${idPedido}`);
    if (!response.ok) {
      throw new Error("No se pudo obtener el historial detallado de este pedido.");
    }
    return await response.json();
  },

  procesarDevolucion: async (
    idPedido: number, 
    nuevoEstado: 'PENDIENTE' | 'DEVUELTO', 
    observaciones: string, 
    idUsuario: number
  ): Promise<any> => {
    const response = await apiFetch(`${API_URL}/${idPedido}/cambiar-estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevoEstado,
        observaciones,
        idUsuario
      })
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, "Error al procesar la devolución."));
    }

    return await response.json();
  },

  subirComprobanteFisico: async (idPedido: number, archivo: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('comprobante', archivo);

    const response = await apiFetch(`${API_URL}/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData
    });

    return response.ok;
  },

  eliminarComprobanteFisico: async (idPedido: number): Promise<boolean> => {
    const response = await apiFetch(`${API_URL}/${idPedido}/comprobante`, {
      method: 'DELETE'
    });

    return response.ok;
  }
};