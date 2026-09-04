import { apiFetch } from '../../../../config/api';
const API_URL = 'http://localhost:8080/api/pedidos';

export const historialPedidoService = {
  /**
   * Obtiene los detalles completos de un pedido para la auditoría
   */
  obtenerPorId: async (idPedido: number): Promise<any> => {
    const response = await apiFetch(`${API_URL}/${idPedido}`);
    if (!response.ok) {
      throw new Error("No se pudo obtener el historial detallado de este pedido.");
    }
    return await response.json();
  },

  /**
   * Procesa la devolución cambiando el estado
   */
  procesarDevolucion: async (
    idPedido: number, 
    nuevoEstado: 'PENDIENTE' | 'DEVUELTO', 
    observaciones: string, 
    idUsuario: number
  ): Promise<any> => {
    // CORRECCIÓN: La URL es /cambiar-estado y la clave es nuevoEstado
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
      const errorText = await response.text();
      throw new Error(errorText || "Error al procesar la devolución.");
    }

    return await response.json();
  },

  /**
   * Adjunta comprobante físico en el histórico
   */
  subirComprobanteFisico: async (idPedido: number, archivo: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('comprobante', archivo);

    const response = await apiFetch(`${API_URL}/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData
    });

    return response.ok;
  },

  /**
   * Elimina comprobante físico en el histórico
   */
  eliminarComprobanteFisico: async (idPedido: number): Promise<boolean> => {
    const response = await apiFetch(`${API_URL}/${idPedido}/comprobante`, {
      method: 'DELETE'
    });

    return response.ok;
  }
};