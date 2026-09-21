import type { CategoriaCliente } from '../../../clientes/types/CategoriaCliente';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../../config/api';

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

  guardarPedido: async (payloadData: GuardarPedidoPayload): Promise<any> => {
    let response: Response;
    const { fileComprobante, ...datosJSON } = payloadData;

    if (fileComprobante) {
      const formData = new FormData();

      const jsonBlob = new Blob([JSON.stringify(datosJSON)], { type: 'application/json' });
      formData.append('payload', jsonBlob);
      formData.append('comprobante', fileComprobante);

      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        body: formData,
      });
    } else {
      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosJSON),
      });
    }

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al guardar el pedido.'));
    }

    return await response.json();
  }
};