import type { Pedido } from '../types/Pedido';
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

  asignarEmpleado: async (idPedido: number, idEmpleado: string) => {
    const response = await fetch(`http://localhost:8080/api/pedidos/${idPedido}/asignar-empleado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idEmpleado })
    });

    if (!response.ok) throw new Error('Error al asignar el empleado');

    // AQUÍ ESTÁ LA CORRECCIÓN:
    // Verificamos si la respuesta tiene contenido antes de intentar convertirla a JSON
    const text = await response.text();
    return text ? JSON.parse(text) : null; 
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
  },

  obtenerTodos: async (): Promise<Pedido[]> => {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Error al obtener la lista de pedidos');
    return await response.json();
  },

  actualizarUbicacion: async (idPedido: number, nuevaUbicacion: string) => {
  const response = await fetch(`${BASE_URL}/${idPedido}/ubicacion`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ubicacionEstante: nuevaUbicacion })
  });

  if (!response.ok) {
    throw new Error('Error al actualizar la ubicación del pedido');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
  }

};