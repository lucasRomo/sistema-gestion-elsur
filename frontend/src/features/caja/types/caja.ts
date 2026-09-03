export interface UsuarioCaja {
  idUsuario?: number;
  id_usuario?: number;
  nombre?: string;
  apellido?: string;
  username?: string;
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
  fecha: string;
  usuario?: UsuarioCaja | string;
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
  monto: string | number;
  concepto: string;
  tipoMovimiento: 'INGRESO' | 'EGRESO';
  categoria?: string;
  idPedido?: string | null;
  metodoPago?: string;
}

export interface Turno {
  idTurno: number;
  usuario?: UsuarioCaja | string;
  fechaApertura: string;
  fechaCierre?: string | null;
  montoInicial: number;
  montoEsperadoSistema?: number;
  montoRealContado?: number;
  diferenciaArqueo?: number;
  observaciones?: string;
  estado: 'ABIERTO' | 'CERRADO';
}