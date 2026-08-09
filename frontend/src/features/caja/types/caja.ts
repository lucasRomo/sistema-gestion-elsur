export interface MovimientoCaja {
  id_movimiento?: number;
  idMovimiento?: number;
  monto: number;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  categoria?: string;
  descripcion: string;
  metodoPago?: string;
  fecha: string;
  usuario?: {
    idUsuario?: number;
    id_usuario?: number;
  };
  pedido?: {
    idPedido?: number;
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

export interface NuevoMovimientoDTO {
  monto: string;
  concepto: string;
  tipoMovimiento: string;
  idPedido: string | null;
}