import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../../config/api';

const API_URL = `${API_BASE_URL}/pedidos`;

export const PedidoPendienteService = {

  obtenerTodos: async (): Promise<any[]> => {
    const response = await apiFetch(API_URL);
    if (!response.ok) {
      throw new Error("Error al obtener la lista de pedidos.");
    }
    return await response.json();
  },

  verificarEstadoCaja: async (): Promise<boolean> => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/turnos/estado-caja`);
      if (!res.ok) return false;
      const text = await res.text();
      if (!text || text.trim() === "" || text === "null") return false;
      const turno = JSON.parse(text);
      return turno !== null && typeof turno === 'object' && 'idTurno' in turno;
    } catch (error) {
      console.error("Error al comprobar el estado de la caja:", error);
      return false;
    }
  },

  cambiarEstado: async (
    idPedido: number,
    nuevoEstado: string,
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
      throw new Error(await extraerMensajeError(response, "Error al actualizar el estado del pedido."));
    }

    return await response.json();
  },

  registrarPago: async (
    idPedido: number,
    monto: number,
    tipoPago: string,
    idUsuario: number = 1,
    archivo: File | null = null
  ): Promise<any> => {
    const formData = new FormData();
    const payload = { monto, tipoPago, idUsuario };

    formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (archivo) {
      formData.append("comprobante", archivo);
    }

    const response = await apiFetch(`${API_URL}/${idPedido}/pagos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, "Error al procesar el pago."));
    }

    return await response.json();
  },

  vincularComprobanteDigital: async (idComprobante: number, archivo: File): Promise<any> => {
    const formData = new FormData();
    formData.append("comprobante", archivo);

    const response = await apiFetch(`${API_URL}/comprobantes/${idComprobante}/archivo`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error("No se pudo subir el archivo del comprobante.");
    }

    return await response.json();
  },

  obtenerRecetaProducto: async (idProducto: number): Promise<any[]> => {
    const response = await apiFetch(`${API_BASE_URL}/producto-insumo/producto/${idProducto}`);
    if (!response.ok) {
      throw new Error(`Error al obtener la receta del producto ${idProducto}`);
    }
    return await response.json();
  },

  eliminarComprobanteDigital: async (idComprobante: number): Promise<any> => {
    const response = await apiFetch(`${API_URL}/comprobantes/${idComprobante}/archivo`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar el archivo del comprobante.");
    }

    return await response.json();
  },

  asignarEmpleado: async (idPedido: number, idEmpleado: string, idUsuario: number): Promise<any> => {
    const response = await apiFetch(`${API_URL}/${idPedido}/asignar-empleado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idEmpleado,
        idUsuario
      })
    });

    if (!response.ok) {
      throw new Error("No se pudo asignar el empleado al pedido.");
    }
    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  },

  actualizarUbicacion: async (idPedido: number, nuevaUbicacion: string): Promise<any> => {
    const response = await apiFetch(`${API_URL}/${idPedido}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ubicacion: nuevaUbicacion,
        ubicacionEstante: nuevaUbicacion,
        ubicacion_estante: nuevaUbicacion
      })
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, "No se pudo actualizar la ubicación del pedido."));
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  actualizarLimiteCredito: async (idCliente: number, nuevoLimite: number): Promise<any> => {
    const response = await apiFetch(`${API_BASE_URL}/clientes/${idCliente}/limite-credito`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limiteCredito: nuevoLimite })
    });

    if (!response.ok) {
      throw new Error("No se pudo actualizar el límite de crédito del cliente.");
    }

    return await response.json();
  }
};