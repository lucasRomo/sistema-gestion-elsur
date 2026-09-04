import type { Pedido } from '../../general/types/Pedido';
import { API_BASE_URL, apiFetch } from '../../../../config/api';

export const pedidoService = {
  /**
   * Obtiene un pedido completo por su ID con relaciones frescas de auditoría
   */
  obtenerPorId: async (idPedido: number): Promise<any | null> => {
    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  asignarEmpleado: async (idPedido: number, idEmpleado: string) => {
    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/asignar-empleado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idEmpleado })
    });

    if (!response.ok) throw new Error('Error al asignar el empleado');

    const text = await response.text();
    return text ? JSON.parse(text) : null; 
  },

  /**
   * Sube una captura o imagen física de comprobante al backend
   */
  subirComprobanteFisico: async (idPedido: number, file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('comprobante', file);

    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  },

  /**
   * Elimina el comprobante tanto del disco como del registro en la BD
   */
  eliminarComprobanteFisico: async (idPedido: number): Promise<boolean> => {
    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/comprobante`, {
      method: 'DELETE',
    });
    return response.ok;
  },

  obtenerTodos: async (): Promise<Pedido[]> => {
    const response = await apiFetch(`${API_BASE_URL}/pedidos`);
    if (!response.ok) throw new Error('Error al obtener la lista de pedidos');
    return await response.json();
  },

  actualizarUbicacion: async (idPedido: number, nuevaUbicacion: string) => {
    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicacionEstante: nuevaUbicacion })
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la ubicación del pedido');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  cambiarEstado: async (idPedido: number, nuevoEstado: string, observaciones: string = '', idUsuario: number = 1) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevoEstado,
          observaciones,
          idUsuario
        }),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || 'Error al cambiar el estado del pedido');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      throw error;
    }
  },

  actualizarLimiteCredito: async (idCliente: number, limiteCredito: number) => {
    const response = await apiFetch(`${API_BASE_URL}/cuentas-corrientes/cliente/${idCliente}/limite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limiteCredito })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al actualizar el límite de crédito.");
    }
    return true;
  }
};