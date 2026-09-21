export interface ItemCompraInsumo {
  tipoItem: 'INSUMO' | 'PRODUCTO';
  idInsumo?: number;
  idProducto?: number;
  esNuevoInsumo?: boolean;
  nombreInsumo: string; 
  cantidadEmpaquetada: number; 
  precioUnitario: number;
  subtotal: number;
  factorConversion?: number;
  idUnidad?: number;
  idUnidadCompra?: number;
}

export interface DatosCompraInsumo {
  montoTotal: number;
  metodoPago: string;
  concepto: string;
  idUsuario?: number;
  idProveedor?: number;
  items: ItemCompraInsumo[];
  comprobanteImagen?: string | null;
}