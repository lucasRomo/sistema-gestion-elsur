export interface MovimientoCaja {
  id_movimiento?: number;
  idMovimiento?: number;
  monto: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  descripcion: string;
  fecha: string;
  metodoPago?: string;
  usuario?: any;
  pedido?: any;
}

export interface TotalesCaja {
  totalIngresos: number;
  totalEgresos: number;
  saldoActual: number;
}

const API_BASE_URL = 'http://localhost:8080/api';

export const cajaService = {
  // NUEVO: Obtiene TODOS los movimientos para poder filtrar cualquier rango de fechas en Informes
  obtenerTodos: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodos:', error);
      return [];
    }
  },

  // Obtiene los movimientos de la caja del día activo
  obtenerMovimientosDia: async (): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/dia`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosDia:', error);
      return [];
    }
  },

  // Obtiene los totales acumulados (Ingresos, Egresos, Saldo)
  obtenerTotales: async (): Promise<TotalesCaja | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/totales`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTotales:', error);
      return null;
    }
  }

  
};