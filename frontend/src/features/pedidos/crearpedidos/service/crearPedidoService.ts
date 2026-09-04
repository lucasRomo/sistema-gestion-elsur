import type { CategoriaCliente } from '../../../clientes/types/CategoriaCliente';
import { apiFetch } from '../../../../config/api';

const API_PEDIDOS = 'http://localhost:8080/api/pedidos';
const API_CATEGORIAS = 'http://localhost:8080/api/categorias-cliente';
const API_PRODUCTO_INSUMO = 'http://localhost:8080/api/producto-insumo/producto';

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
      const response = await fetch(`${API_PRODUCTO_INSUMO}/${idProducto}`);
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
  guardarPedido: async (
    payload: { pedido: any; idEmpleado: number; idUsuario: number | null; tipoPago: string },
    comprobante?: File | null
  ): Promise<any> => {
    let response: Response;

    if (comprobante) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      formData.append('comprobante', comprobante);

      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Envío en formato JSON tradicional
      response = await apiFetch(API_PEDIDOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al guardar el pedido.');
    }

    return await response.json();
  }
};