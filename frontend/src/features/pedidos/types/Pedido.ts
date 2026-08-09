import type { Producto, } from '../../productos/types/Producto';

export interface DetallePedido {
  id_detalle?: number;
  producto: { idProducto: number } | Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pago {
  id_pago?: number;
  monto: number;
  tipoPago: string;
  urlComprobante?: string; 
  fecha_pago?: string;
}

export interface HistorialEstadoPedido {
  id_historial: number;
  fecha_cambio: string;
  estado_anterior: string;
  estado_nuevo: string;
  observaciones?: string;
  usuarioResponsable?: {
    id_usuario: number;
    nombre_usuario: string;
  };
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
  
  // ➔ AGREGAR ESTO PARA QUE REACT LEA EL HISTORIAL
  historiales?: HistorialEstadoPedido[]; 
}
export interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}