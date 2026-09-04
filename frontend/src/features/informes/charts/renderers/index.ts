import type { FC } from 'react';
import type { TipoGraficoInforme, RendererChartProps } from '../../types/informeTypes';
import {
  CategoriasEgresosChart,
  CategoriasIngresosChart,
  EgresosChart,
  IngresosChart,
  MediosPagoChart,
} from './FinanzasRenderers';
import { CategoriasChart, EstadosChart, ProductosChart } from './VentasRenderers';
import {
  PedidosDevueltosEmpleadoChart,
  PedidosEmpleadosChart,
  RecaudacionEmpleadosChart,
  TiempoMaximoEmpleadoChart,
  TiempoPromedioPedidoChart,
} from './OperacionesRenderers';
import { CategoriasClienteChart, ClientesChart, DeudoresChart } from './ClientesRenderers';
import { AveriasChart, IncongruenciasChart, MermasChart } from './ControlRenderers';

export type ChartRendererComponent = FC<RendererChartProps>;

export const RENDERERS_INFORME: Record<TipoGraficoInforme, ChartRendererComponent> = {
  ingresos: IngresosChart,
  mediosPago: MediosPagoChart,
  egresos: EgresosChart,
  categoriasIngresos: CategoriasIngresosChart,
  categoriasEgresos: CategoriasEgresosChart,

  estados: EstadosChart,
  productos: ProductosChart,
  categorias: CategoriasChart,

  recaudacionEmpleados: RecaudacionEmpleadosChart,
  pedidosEmpleados: PedidosEmpleadosChart,
  pedidosdevueltosempleado: PedidosDevueltosEmpleadoChart,
  tiempoMaximoEmpleado: TiempoMaximoEmpleadoChart,
  tiempoPromedioPedido: TiempoPromedioPedidoChart,

  clientes: ClientesChart,
  deudores: DeudoresChart,
  categoriasCliente: CategoriasClienteChart,

  mermas: MermasChart,
  averias: AveriasChart,
  incongruencias: IncongruenciasChart,
};