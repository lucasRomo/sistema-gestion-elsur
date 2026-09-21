import type { Pedido } from '../../general/types/Pedido';
import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../../config/api';

export const pedidoService = {

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

  subirComprobanteFisico: async (idPedido: number, file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('comprobante', file);

    const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  },

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
        throw new Error(await extraerMensajeError(response, 'Error al cambiar el estado del pedido'));
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
      throw new Error(await extraerMensajeError(response, "Error al actualizar el límite de crédito."));
    }
    return true;
  },

  obtenerCargaTrabajoEmpleados: async (): Promise<Record<number, number>> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/pedidos`);
      if (!response.ok) return {};

      const data = await response.json();
      const conteo: Record<number, number> = {};

      data.forEach((ped: any) => {
        const estadoUpper = String(ped.estado || '').toUpperCase();
        const estaPendiente = !['FINALIZADO', 'CANCELADO', 'ENTREGADO', 'PRESUPUESTO'].includes(estadoUpper);

        if (estaPendiente) {
          if (Array.isArray(ped.asignaciones) && ped.asignaciones.length > 0) {
            ped.asignaciones.forEach((asig: any) => {
              const empId = asig.empleado?.idEmpleado ?? asig.empleado?.id_empleado ?? asig.idEmpleado;
              if (empId) {
                conteo[empId] = (conteo[empId] || 0) + 1;
              }
            });
          } else if (ped.empleado) {
            const empId = ped.empleado.idEmpleado ?? ped.empleado.id_empleado ?? ped.empleado.id;
            if (empId) {
              conteo[empId] = (conteo[empId] || 0) + 1;
            }
          }
        }
      });

      return conteo;
    } catch (error) {
      console.error("Error al consultar carga de trabajo de empleados:", error);
      return {};
    }
  }
};