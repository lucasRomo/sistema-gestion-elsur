// src/features/informes/types/informesTypes.ts
export type SeccionInforme = 'MENU' | 'finanzas' | 'ventas' | 'operaciones' | 'clientes' | 'control';
export type TipoComparacion = 'dia' | 'semana' | 'mes' | 'personalizado';
export type InformeComparacion = 
  | 'ingresos' | 'mediosPago' | 'egresos' | 'estados' 
  | 'productos' | 'categorias' | 'recaudacionEmpleados' 
  | 'pedidosEmpleados' | 'clientes' | 'categoriasCliente' | 'deudores' | 'categoriasIngresos' | 'categoriasEgresos'
  | 'tiempoPromedioPedido' | 'tiempoMaximoEmpleado' | 'pedidosdevueltosempleado' | 'mermas'
  | 'averias' | 'incongruencias'; 

  
export interface RendererChartProps {
  data: any;
  esAnterior?: boolean;
  esMismoDia?: boolean;
  isDark: boolean;
  isMobile: boolean;
}

export interface KpiCard {
  label: string;
  sub: string;
  val: string | number;
  color: string;
  icon: string;
  points: string;
  changePercent?: number;
}

export interface PeriodoRango {
  desde: string;
  hasta: string;
}

export interface ComparacionDataState {
  actual: any;
  anterior: any;
  periodoActual: PeriodoRango;
  periodoAnterior: PeriodoRango;
}

export interface MetricaDevolucionesEmpleado {
  empleado: string;
  cantidad: number;
}

export type TipoGraficoInforme = 
  | 'ingresos' 
  | 'mediosPago' 
  | 'egresos' 
  | 'estados' 
  | 'productos' 
  | 'categorias' 
  | 'recaudacionEmpleados' 
  | 'pedidosEmpleados' 
  | 'clientes' 
  | 'deudores' 
  | 'categoriasCliente'
  | 'categoriasIngresos'
  | 'categoriasEgresos'
  | 'mermas'
  | 'averias'
  | 'incongruencias'
  | 'pedidosdevueltosempleado'
  | 'tiempoPromedioPedido'
  | 'tiempoMaximoEmpleado';