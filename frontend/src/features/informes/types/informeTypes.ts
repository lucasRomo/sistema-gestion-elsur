// src/features/informes/types/informesTypes.ts
export type SeccionInforme = 'MENU' | 'finanzas' | 'ventas' | 'operaciones' | 'clientes' | 'control';
export type TipoComparacion = 'dia' | 'semana' | 'mes' | 'personalizado';
export type InformeComparacion = 
  | 'ingresos' | 'mediosPago' | 'egresos' | 'estados' 
  | 'productos' | 'categorias' | 'recaudacionEmpleados' 
  | 'pedidosEmpleados' | 'clientes' | 'categoriasCliente';

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

export type TipoGraficoInforme =
  | InformeComparacion
  | 'mermas'
  | 'averias'
  | 'incongruencias';