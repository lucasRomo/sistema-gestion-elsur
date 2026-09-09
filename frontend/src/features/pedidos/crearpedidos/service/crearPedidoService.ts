import type { CategoriaCliente } from '../../../clientes/types/CategoriaCliente';
import { API_BASE_URL, apiFetch } from '../../../../config/api';

const API_PEDIDOS = `${API_BASE_URL}/pedidos`;
const API_CATEGORIAS = `${API_BASE_URL}/categorias-cliente`;
const API_PRODUCTO_INSUMO = `${API_BASE_URL}/producto-insumo/producto`;

export interface GuardarPedidoPayload {
  pedido: any;
  idEmpleado: number;
  idUsuario?: number;
  tipoPago: string;
  fileComprobante?: File | null;
}

export const crearPedidoService = {
  /**
   * Obtiene la lista de categorías de cliente normalizando los datos de la respuesta.
   */
  obtenerCategoriasCliente: async (): Promise<CategoriaCliente[]> => {
    const response = await apiFetch(API_CATEGORIAS);
    if (!response.ok) {
      throw new Error('Error al obtener las categorías de cliente');
    }
    const data = await response.json();
    
    return data.map((cat: any) => ({
      idCategoriaCliente: cat.idCategoria ?? cat.id_categoria ?? cat.idCategoriaCliente ?? cat.id,
      nombreCategoria: cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Categoría',
      porcentajeDescuento: Number(cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.porcentajeDescuento ?? cat.descuento ?? 0)
    }));
  },

  /**
   * Obtiene la receta/insumos asociados a un producto específico.
   */
  obtenerRecetaProducto: async (idProducto: number): Promise<any[]> => {
    try {
      const response = await apiFetch(`${API_PRODUCTO_INSUMO}/${idProducto}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error al obtener la receta del producto:', error);
      return [];
    }
  },

  /**
   * Envía un pedido al backend. Admite envío con o sin comprobante físico (Multipart/JSON).
   */
  guardarPedido: async (payloadData: GuardarPedidoPayload): Promise<any> => {
    let response: Response;
    const { fileComprobante, ...datosJSON } = payloadData;

    if (fileComprobante) {
      const formData = new FormData();

      // Convertimos el objeto JSON sin el archivo a un Blob
      const jsonBlob = new Blob([JSON.stringify(datosJSON)], { type: 'application/json' });
      formData.append('payload', jsonBlob);
      formData.append('comprobante', fileComprobante);

      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Envío en formato JSON tradicional directo
      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosJSON),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al guardar el pedido.');
    }

    return await response.json();
  }
};