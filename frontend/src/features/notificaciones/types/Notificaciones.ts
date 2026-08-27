export type TipoNotificacion =
  | 'PEDIDO_DEMORADO'
  | 'PEDIDO_PENDIENTE'
  | 'STOCK_BAJO'
  | 'MOVIMIENTO_CAJA'
  | 'FALLA_MAQUINA';

export interface NotificacionItem {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  descripcion: string;
  fecha: string;
  icono: string; 
  color: 'danger' | 'warning' | 'info' | 'success';
}