import { API_BASE_URL } from '../../../config/api';

async function obtenerJsonSiOk<T>(url: string, valorPorDefecto: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : valorPorDefecto;
  } catch (error) {
    console.error(`Error de red al consultar ${url}:`, error);
    return valorPorDefecto;
  }
}

export const informesService = {
  async obtenerMermas(): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/mermas`, []);
  },

  async obtenerResumenDeudores(): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/cuentas-corrientes/resumen-deudores`, []);
  },

  async obtenerAverias(): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/incidencias`, []);
  },

  async obtenerCategoriasCliente(): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/categorias-cliente`, []);
  },

 async obtenerTodosLosTurnos(): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/turnos`, []);
  },

async obtenerMovimientosPorTurno(idTurno: number): Promise<any[]> {
    return obtenerJsonSiOk<any[]>(`${API_BASE_URL}/movimientos-caja/turno/${idTurno}`, []);
  },

  async obtenerPedidoPorId(idPedido: number): Promise<any | null> {
    return obtenerJsonSiOk<any | null>(`${API_BASE_URL}/pedidos/${idPedido}`, null);
  },

  obtenerUrlComprobante(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrlLimpia = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${baseUrlLimpia}${url.startsWith('/') ? '' : '/'}${url}`;
  },
};