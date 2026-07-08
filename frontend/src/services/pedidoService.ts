const BASE_URL = 'http://localhost:8080/api/pedidos';

export const pedidoService = {
  /**
   * Obtiene un pedido completo por su ID con relaciones frescas de auditoría
   */
  obtenerPorId: async (idPedido: number): Promise<any | null> => {
    const response = await fetch(`${BASE_URL}/${idPedido}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  /**
   * Sube una captura o imagen física de comprobante al backend
   */
  subirComprobanteFisico: async (idPedido: number, file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('comprobante', file);

    const response = await fetch(`${BASE_URL}/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  },

  /**
   * Elimina el comprobante tanto del disco como del registro en la BD
   */
  eliminarComprobanteFisico: async (idPedido: number): Promise<boolean> => {
    const response = await fetch(`${BASE_URL}/${idPedido}/comprobante`, {
      method: 'DELETE',
    });
    return response.ok;
  }
};