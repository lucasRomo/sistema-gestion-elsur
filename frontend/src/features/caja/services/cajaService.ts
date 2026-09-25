import { API_BASE_URL, apiFetch, extraerMensajeError } from '../../../config/api';
import type {
  UsuarioCaja,
  MovimientoCaja,
  TotalesCaja,
  DatosArqueo,
  NuevoMovimientoDTO,
  Turno,
} from '../types/caja';

export type { UsuarioCaja, MovimientoCaja, TotalesCaja, DatosArqueo, NuevoMovimientoDTO, Turno };

export const cajaService = {
  obtenerUrlComprobante: (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_BASE_URL}/movimientos-caja/comprobante/${encodeURIComponent(url)}`;
  },

  obtenerBlobComprobante: async (url?: string | null): Promise<string> => {
  if (!url) throw new Error('Sin comprobante');
  if (url.startsWith('data:')) return url; 

  const path = url.startsWith('http')
    ? url.substring(url.lastIndexOf('/') + 1) 
    : url;

  const response = await apiFetch(`/movimientos-caja/comprobante/${encodeURIComponent(path)}`);
  if (!response.ok) throw new Error('No se pudo cargar el comprobante');

  const blob = await response.blob();
  return URL.createObjectURL(blob);
  },

  subirComprobante: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/comprobante`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al subir el comprobante'));
    }

    const data = await response.json();
    return data.path;
  },

  obtenerPedidoPorId: async (idPedido: number): Promise<any | null> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/pedidos/${idPedido}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerPedidoPorId:', error);
      return null;
    }
  },


  obtenerTodos: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/movimientos-caja`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodos:', error);
      return [];
    }
  },

  obtenerMovimientosDia: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/dia`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosDia:', error);
      return [];
    }
  },

  obtenerTotales: async (): Promise<TotalesCaja | null> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/totales`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTotales:', error);
      return null;
    }
  },

  obtenerTotalesPorTurno: async (idTurno: number): Promise<TotalesCaja | null> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/totales/turno/${idTurno}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTotalesPorTurno:', error);
      return null;
    }
  },

  obtenerTodosLosTurnos: async (): Promise<Turno[]> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/turnos`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodosLosTurnos:', error);
      return [];
    }
  },

  obtenerMovimientosPorTurno: async (idTurno: number): Promise<MovimientoCaja[]> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/turno/${idTurno}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosPorTurno:', error);
      return [];
    }
  },

  obtenerEstadoCaja: async (): Promise<Turno | null> => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/turnos/estado-caja`);
      if (!response.ok) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('Error en cajaService.obtenerEstadoCaja:', error);
      return null;
    }
  },

  abrirTurno: async (montoInicial: number): Promise<Turno> => {
    const response = await apiFetch(`${API_BASE_URL}/turnos/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fechaApertura: new Date().toISOString(),
        montoInicial,
        estado: 'ABIERTO'
      })
    });
    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al abrir la caja'));
    }
    return response.json();
  },

  obtenerDesgloseArqueo: async (): Promise<DatosArqueo> => {
    const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/desglose-arqueo`);
    if (!response.ok) throw new Error('Error al obtener desglose de arqueo');
    return response.json();
  },

  obtenerDesgloseArqueoPorTurno: async (idTurno: number): Promise<DatosArqueo> => {
    const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/desglose-arqueo/turno/${idTurno}`);
    if (!response.ok) throw new Error('Error al obtener desglose de arqueo del turno');
    return response.json();
  },

  guardarMovimiento: async (movimiento: any): Promise<void> => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario || 1;

    const payload = {
      monto: Number(movimiento.monto),
      tipoMovimiento: movimiento.tipoMovimiento,
      categoria: movimiento.categoria || 'INGRESO',
      descripcion: movimiento.descripcion || movimiento.concepto,
      metodoPago: movimiento.metodoPago || 'EFECTIVO',
      comprobanteImagen: movimiento.comprobanteImagen || null,
      fecha: movimiento.fecha || new Date().toISOString(),
      pedido: movimiento.pedido || (movimiento.idPedido ? { idPedido: Number(movimiento.idPedido) } : null),
      usuario: movimiento.usuario || { idUsuario }
    };

    const response = await apiFetch(`${API_BASE_URL}/movimientos-caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al guardar movimiento'));
    }
  },

  cerrarTurno: async (idTurno: number, montoReal: number, observaciones?: string, idUsuario?: number): Promise<boolean> => {
    const url = `${API_BASE_URL}/turnos/${idTurno}/cerrar?montoReal=${montoReal}${
      observaciones ? `&observaciones=${encodeURIComponent(observaciones)}` : ''
    }${idUsuario ? `&idUsuario=${idUsuario}` : ''}`;
    const response = await apiFetch(url, { method: 'POST' });
    if (!response.ok) {
      throw new Error(await extraerMensajeError(response, 'Error al cerrar caja'));
    }
    return true;
  }
};

export const cajaServiceExtended = {
  ...cajaService,
};