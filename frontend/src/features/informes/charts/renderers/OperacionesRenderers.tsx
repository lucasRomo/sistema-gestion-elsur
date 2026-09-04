import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, LabelList,
  Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { ChartScrollWrapper } from '../ChartScrollWrapper';
import { crearRendererEtiquetasSinColision, formatearCantidad, normalizarDatosTorta } from '../etiquetasPieSinColision';
import { COLORES_TORTA } from '.././Colores';
import { CustomDevueltosTooltip, CustomEmpleadoTooltip, CustomTiempoTooltip } from '../../tooltips/InformesTooltips';
import type { RendererChartProps } from '../../types/informeTypes';

export const RecaudacionEmpleadosChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.rendimientoEmpleados?.length || 0} anchoPorItem={70} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
        <RechartsTooltip cursor={false} content={<CustomEmpleadoTooltip />} />
        <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#0dcaf0'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="ventas" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" formatter={(val: any) => `$${Number(val || 0).toLocaleString('es-AR')}`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);

export const PedidosEmpleadosChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.pedidosCompletadosPorEmpleado || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearCantidad, isDark)}
          labelLine={false}
          fontSize={12}
          fontWeight="bold"
        >
          {datosTorta.map((_: any, index: number) => (
            <Cell key={`cell-emp-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const PedidosDevueltosEmpleadoChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.pedidosDevueltosPorEmpleado || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearCantidad, isDark)}
          labelLine={false}
          fontSize={12}
          fontWeight="bold"
        >
          {datosTorta.map((entry: any, index: number) => (
            <Cell key={`cell-dev-${index}`} fill={entry.color || COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomDevueltosTooltip />} />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TiempoMaximoEmpleadoChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.tiempoMaximoEmpleado?.length || 0} anchoPorItem={70} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.tiempoMaximoEmpleado} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}m`} />
        <RechartsTooltip cursor={false} content={<CustomTiempoTooltip titulo="Máximo" />} />
        <Bar dataKey="valor" fill={esAnterior ? '#71717a' : '#ffc107'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="valor" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" formatter={(val: any) => `${val}m`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);

export const TiempoPromedioPedidoChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.tiempoPromedioPedidoPorEmpleado?.length || 0} anchoPorItem={70} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.tiempoPromedioPedidoPorEmpleado} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}m`} />
        <RechartsTooltip cursor={false} content={<CustomTiempoTooltip titulo="Promedio" />} />
        <Bar dataKey="valor" fill={esAnterior ? '#71717a' : '#b66b09'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="valor" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" formatter={(val: any) => `${val}m`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);