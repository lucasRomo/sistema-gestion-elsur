import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';
import type { TipoDocumento } from '../../../types/TipoDocumento';
import type { Cliente } from '../types/Cliente';

export type { TipoDocumento };

const BASE_URL = API_BASE_URL || 'http://localhost:8080/api';

export const clienteService = {
  getClientes: async (): Promise<Cliente[]> => {
    const res = await apiFetch(`${BASE_URL}/clientes`);
    if (!res.ok) throw new Error("Error al obtener clientes");
    return res.json();
  },

  crearCliente: async (cliente: any) => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuarioActual = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

    const url = idUsuarioActual 
      ? `${BASE_URL}/clientes?idUsuario=${idUsuarioActual}` 
      : `${BASE_URL}/clientes`;

    const res = await apiFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });

    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al crear el cliente.'));
    return res;
  },

  getTiposDocumento: async (): Promise<TipoDocumento[]> => {
    try {
      const res = await apiFetch(`${BASE_URL}/tipos-documento`);
      if (!res.ok) throw new Error("Error al consultar tipos de documento");
      return await res.json();
    } catch {
      return [
        { idTipoDocumento: 1, nombreTipo: 'DNI', nombre: 'DNI' },
        { idTipoDocumento: 2, nombreTipo: 'CUIT', nombre: 'CUIT' },
        { idTipoDocumento: 3, nombreTipo: 'CUIL', nombre: 'CUIL' },
        { idTipoDocumento: 4, nombreTipo: 'PASAPORTE', nombre: 'PASAPORTE' }
      ];
    }
  },

  getCategorias: async () => {
    const res = await apiFetch(`${BASE_URL}/categorias-cliente`);
    if (!res.ok) throw new Error("Error al obtener categorías");
    return res.json();
  },

  crearCategoria: async (categoria: { nombre: string; descuentoAutomatico: number }) => {
    const res = await apiFetch(`${BASE_URL}/categorias-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria)
    });

    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al crear la categoría.'));
    return res.json();
  },

  actualizarCategoria: async (id: number, categoria: { nombre: string; descuentoAutomatico: number }) => {
    const res = await apiFetch(`${BASE_URL}/categorias-cliente/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria)
    });
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al actualizar la categoría.'));
    return res.json();
  },

  eliminarCategoria: async (id: number) => {
    const res = await apiFetch(`${BASE_URL}/categorias-cliente/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al eliminar la categoría.'));
    return res;
  },

  getMovimientos: async (idCliente: number) => {
    const res = await apiFetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/movimientos`);
    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al obtener los movimientos de la cuenta corriente.'));
    return res.json();
  },

  actualizarLimiteCredito: async (idCliente: number, limiteCredito: number) => {
    const res = await apiFetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/limite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limiteCredito })
    });

    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al actualizar el límite de crédito.'));
    return res;
  },

  registrarPago: async (
    idCliente: number, 
    monto: number, 
    descripcion: string, 
    metodoPago: string = 'EFECTIVO', 
    comprobanteImagen?: string
  ) => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario;

    const res = await apiFetch(`${BASE_URL}/cuentas-corrientes/cliente/${idCliente}/registrar-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        monto, 
        descripcion, 
        metodoPago, 
        comprobanteImagen, 
        idUsuario
      })
    });

    if (!res.ok) throw new Error(await extraerMensajeError(res, 'Error al registrar el pago.'));
    return res.json();
  }
};