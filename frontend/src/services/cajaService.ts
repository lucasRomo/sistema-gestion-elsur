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

export interface ArqueoCaja {
  id: number;
  fechaCierre: string;
  usuarioCierre: string;
  montoEsperado: number;
  montoReal: number;
  diferencia: number;   
  estado: 'APROBADO' | 'PENDIENTE' | 'OBSERVADO';
  observacion?: string;
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
  },

  obtenerTodosLosTurnos: async (): Promise<Turno[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/turnos`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerTodosLosTurnos:', error);
      return [];
    }
  },

  // NUEVO: Movimientos de un turno específico (para el detalle del arqueo)
  obtenerMovimientosPorTurno: async (idTurno: number): Promise<MovimientoCaja[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/movimientos-caja/turno/${idTurno}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en cajaService.obtenerMovimientosPorTurno:', error);
      return [];
    }
  }

};