import type { DatosCompraInsumo } from '../components/ModalCompraInsumos';

export interface MovimientoCaja {
  id_movimiento?: number;
  idMovimiento?: number;
  monto: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  descripcion: string;
  fecha: string;
  metodoPago?: string;
  categoria?: string;
  comprobanteImagen?: string;
  comprobante?: string;
  imagenComprobante?: string;
  comprobante_imagen?: string;
  imagen_comprobante?: string;
  usuario?: any;
  pedido?: any;
}

export interface TotalesCaja {
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
}

export interface Turno {
  idTurno: number;
  usuario?: any;
  fechaApertura: string;
  fechaCierre?: string | null;
  montoInicial: number;
  montoEsperadoSistema?: number;
  montoRealContado?: number;
  diferenciaArqueo?: number;
  observaciones?: string;
  estado: 'ABIERTO' | 'CERRADO';
}

export interface DatosArqueo {
  totalEfectivo: number;
  totalTransferencias: number;
  efectivoIngresos: number;
  efectivoEgresos: number;
  transferenciaIngresos: number;
  transferenciaEgresos: number;
  saldoTotal: number;
}

export interface NuevoMovimientoDTO {
  monto: string;
  concepto: string;
  tipoMovimiento: string;
  idPedido: string | null;
}

const API_BASE_URL = 'http://localhost:8080/api';

export const cajaService = {
  obtenerTodos: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodos:', error);
      return [];
    }
  },

  obtenerMovimientosDia: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/dia`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosDia:', error);
      return [];
    }
  },

  obtenerTotales: async (): Promise<TotalesCaja | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/totales`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTotales:', error);
      return null;
    }
  },

  obtenerTodosLosTurnos: async (): Promise<Turno[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/turnos`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodosLosTurnos:', error);
      return [];
    }
  },

  obtenerMovimientosPorTurno: async (idTurno: number): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/turno/${idTurno}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosPorTurno:', error);
      return [];
    }
  },

  obtenerEstadoCaja: async (): Promise<Turno | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/turnos/estado-caja`);
      if (!response.ok) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('Error en cajaService.obtenerEstadoCaja:', error);
      return null;
    }
  },

  abrirTurno: async (montoInicial: number): Promise<Turno> => {
    const response = await fetch(`${API_BASE_URL}/turnos/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fechaApertura: new Date().toISOString(),
        montoInicial,
        estado: 'ABIERTO'
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Error al abrir la caja');
    }
    return response.json();
  },

  obtenerDesgloseArqueo: async (): Promise<DatosArqueo> => {
    const response = await fetch(`${API_BASE_URL}/movimientos-caja/desglose-arqueo`);
    if (!response.ok) throw new Error('Error al obtener desglose de arqueo');
    return response.json();
  },

  guardarMovimiento: async (movimiento: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/movimientos-caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimiento)
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Error al guardar movimiento');
    }
  },

  cerrarTurno: async (idTurno: number, montoReal: number, observaciones?: string): Promise<boolean> => {
    const url = `${API_BASE_URL}/turnos/${idTurno}/cerrar?montoReal=${montoReal}${
      observaciones ? `&observaciones=${encodeURIComponent(observaciones)}` : ''
    }`;
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Error al cerrar caja');
    }
    return true;
  }
};

export const cajaServiceExtended = {
  ...cajaService,

  registrarCompraInsumo: async (datos: DatosCompraInsumo): Promise<any> => {
    const usuarioGuardado = localStorage.getItem('usuario_logueado');
    const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    const idUsuario = usuarioObj?.idUsuario || usuarioObj?.id_usuario || 1;

    const payload = {
      ...datos,
      idUsuario
    };

    const response = await fetch(`${API_BASE_URL}/compras-insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Error al registrar la compra de insumos');
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }
};