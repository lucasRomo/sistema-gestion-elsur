const API_URL = 'http://localhost:8080/api/pedidos';

export const PedidoPendienteService = {
  /**
   * Obtiene la lista completa de pedidos.
   */
  obtenerTodos: async (): Promise<any[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Error al obtener la lista de pedidos.");
    }
    return await response.json();
  },

  /**
   * Cambia el estado del pedido y registra las observaciones e historial.
   */
  cambiarEstado: async (
    idPedido: number,
    nuevoEstado: string,
    observaciones: string,
    idUsuario: number
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/${idPedido}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: nuevoEstado,
        observaciones,
        idUsuario
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al actualizar el estado del pedido.");
    }

    return await response.json();
  },

  /**
   * Registra un pago de pedido con soporte para payload JSON y archivo de comprobante opcional.
   */
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

    const response = await fetch(`${API_URL}/${idPedido}/pagos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al procesar el pago.");
    }

    return await response.json();
  },

  /**
   * Sube un comprobante digital en formato multipart/form-data.
   */
  vincularComprobanteDigital: async (idComprobante: number, archivo: File): Promise<any> => {
    const formData = new FormData();
    formData.append("comprobante", archivo);

    const response = await fetch(`${API_URL}/comprobantes/${idComprobante}/archivo`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error("No se pudo subir el archivo del comprobante.");
    }

    return await response.json();
  },

  /**
   * Elimina la vinculación del comprobante digital.
   */
  eliminarComprobanteDigital: async (idComprobante: number): Promise<any> => {
    const response = await fetch(`${API_URL}/comprobantes/${idComprobante}/archivo`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar el archivo del comprobante.");
    }

    return await response.json();
  },

  /**
   * Asigna un empleado al pedido.
   */
  asignarEmpleado: async (idPedido: number, idEmpleado: string, idUsuario: number): Promise<any> => {
    const response = await fetch(`${API_URL}/${idPedido}/asignar-empleado`, {
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

    return await response.json();
  },

  /**
   * Actualiza el estante u ubicación del pedido.
   */
  actualizarUbicacion: async (idPedido: number, nuevaUbicacion: string): Promise<any> => {
    const response = await fetch(`${API_URL}/${idPedido}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ubicacion: nuevaUbicacion,
        ubicacionEstante: nuevaUbicacion,
        ubicacion_estante: nuevaUbicacion
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "No se pudo actualizar la ubicación del pedido.");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  /**
   * Sube el comprobante físico.
   */
  subirComprobanteFisico: async (idPedido: number, archivo: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await fetch(`${API_URL}/${idPedido}/comprobante-fisico`, {
      method: 'POST',
      body: formData
    });

    return response.ok;
  },

  /**
   * Elimina el comprobante físico del servidor.
   */
  eliminarComprobanteFisico: async (idPedido: number): Promise<boolean> => {
    const response = await fetch(`${API_URL}/${idPedido}/comprobante-fisico`, {
      method: 'DELETE'
    });

    return response.ok;
  },

  /**
   * Actualiza el límite de crédito configurado para un cliente.
   */
  actualizarLimiteCredito: async (idCliente: number, nuevoLimite: number): Promise<any> => {
    const response = await fetch(`http://localhost:8080/api/clientes/${idCliente}/limite-credito`, {
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