import { API_BASE_URL, apiFetch } from '../../../config/api';

// Interfaces importadas / compartidas del dominio de Caja
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

export interface MovimientoCaja {
  id_movimiento?: number;
  idMovimiento?: number;
  monto: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  categoria?: string;
  descripcion: string;
  metodoPago?: string;
  comprobanteImagen?: string;
  comprobante?: string;
  imagenComprobante?: string;
  comprobante_imagen?: string;
  imagen_comprobante?: string;
  urlComprobante?: string;
  url_comprobante?: string;
  fecha: string;
  usuario?: any;
  pedido?: {
    idPedido?: number;
    id_pedido?: number;
  } | null;
}

export interface TotalesCaja {
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
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

/**
 * Función auxiliar para realizar peticiones de forma segura usando apiFetch.
 *
 * CORREGIDO (GAP): antes tragaba cualquier error (respuesta no-OK, red caída,
 * JSON inválido) y devolvía siempre el valorPorDefecto, sin dejar ningún
 * rastro para quien llama -- un endpoint caído era indistinguible de "no hay
 * datos". Ahora acepta un callback opcional onFallo que se dispara en esos
 * casos, para que el que llama pueda enterarse y avisarle al usuario, sin
 * dejar de devolver el valor por defecto (la carga del resto del dashboard
 * no se corta por la falla de una sola fuente de datos).
 */
async function obtenerJsonSiOk<T>(endpoint: string, valorPorDefecto: T, onFallo?: () => void): Promise<T> {
  try {
    const res = await apiFetch(`${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
    if (!res.ok) {
      console.warn(`[informesService] Respuesta no satisfactoria (${res.status}) para ${endpoint}`);
      onFallo?.();
      return valorPorDefecto;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : valorPorDefecto;
  } catch (error) {
    console.error(`[informesService] Error de red o parseo al consultar ${endpoint}:`, error);
    onFallo?.();
    return valorPorDefecto;
  }
}

export const informesService = {
  // --- MÉRMASE INCIDENCIAS ---
  async obtenerMermas(onFallo?: () => void): Promise<any[]> {
    return obtenerJsonSiOk<any[]>('/mermas', [], onFallo);
  },

  async obtenerAverias(onFallo?: () => void): Promise<any[]> {
    return obtenerJsonSiOk<any[]>('/incidencias', [], onFallo);
  },

  // --- CUENTAS CORRIENTES Y CLIENTES ---
  async obtenerResumenDeudores(onFallo?: () => void): Promise<any[]> {
    return obtenerJsonSiOk<any[]>('/cuentas-corrientes/resumen-deudores', [], onFallo);
  },

  async obtenerCategoriasCliente(onFallo?: () => void): Promise<any[]> {
    return obtenerJsonSiOk<any[]>('/categorias-cliente', [], onFallo);
  },

  // --- TURNOS Y MOVIMIENTOS DE CAJA ---
  async obtenerTodosLosTurnos(): Promise<Turno[]> {
    return obtenerJsonSiOk<Turno[]>('/turnos', []);
  },

  async obtenerMovimientosPorTurno(idTurno: number): Promise<MovimientoCaja[]> {
    return obtenerJsonSiOk<MovimientoCaja[]>(`/movimientos-caja/turno/${idTurno}`, []);
  },

  async obtenerTodosLosMovimientos(): Promise<MovimientoCaja[]> {
    return obtenerJsonSiOk<MovimientoCaja[]>('/movimientos-caja', []);
  },

  async obtenerDesgloseArqueoPorTurno(idTurno: number): Promise<DatosArqueo | null> {
    return obtenerJsonSiOk<DatosArqueo | null>(`/movimientos-caja/desglose-arqueo/turno/${idTurno}`, null);
  },

  // --- PEDIDOS ---
  async obtenerPedidoPorId(idPedido: number): Promise<any | null> {
    return obtenerJsonSiOk<any | null>(`/pedidos/${idPedido}`, null);
  },

  // --- UTILIDADES ---
  obtenerUrlComprobante(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  async obtenerBlobComprobante(url?: string | null): Promise<string> {
  if (!url) throw new Error('Sin comprobante');
  if (url.startsWith('data:')) return url;

  const path = url.startsWith('http')
    ? url.substring(url.lastIndexOf('/') + 1)
    : url;

  const response = await apiFetch(`${API_BASE_URL}/movimientos-caja/comprobante/${encodeURIComponent(path)}`);
  if (!response.ok) throw new Error('No se pudo cargar el comprobante');

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

};
