import type { Producto } from './Producto';

export interface DetallePedido {
  id_detalle?: number;
  producto: { idProducto: number } | Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id_pedido?: number;
  cliente: { id_cliente: number }; 
  detalles: DetallePedido[];
  fecha_creacion?: string;
  fecha_entrega_estimada: string;
  fecha_finalizacion?: string;
  estado?: string;
  monto_total: number;
  monto_pago_adelantado: number;
  observaciones?: string;
  ubicacion_estante?: string;
  es_cuenta_corriente: boolean;
  es_presupuesto: boolean;
}

// Tipo auxiliar para el carrito en memoria
export interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}