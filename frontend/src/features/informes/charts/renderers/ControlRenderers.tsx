import React from 'react';
import {
  Bar, BarChart, CartesianGrid, LabelList,
  ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { ChartScrollWrapper } from '../ChartScrollWrapper';
import { CustomArqueoTooltip, CustomAveriaTooltip, CustomMermaTooltip } from '../../tooltips/InformesTooltips';
import type { RendererChartProps } from '../../types/informeTypes';

export const MermasChart: React.FC<RendererChartProps> = ({ data, esAnterior = false, esMismoDia }) => (
  <ChartScrollWrapper cantidadItems={data.mermasPorPeriodo?.length || 0} anchoPorItem={60} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.mermasPorPeriodo} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} barSize={30}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis
          dataKey="ejeX"
          stroke="#a1a1aa"
          tick={{ fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: string) => (value?.includes('#') ? value.split('#')[0] : value)}
        />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <RechartsTooltip cursor={false} content={<CustomMermaTooltip esMismoDia={esMismoDia} />} />
        <Bar dataKey="cantidad" fill={esAnterior ? '#71717a' : '#ffc107'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="cantidad" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);

export const AveriasChart: React.FC<RendererChartProps> = ({ data, esAnterior = false, esMismoDia }) => (
  <ChartScrollWrapper cantidadItems={data.averiasPorPeriodo?.length || 0} anchoPorItem={60} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.averiasPorPeriodo} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} barSize={30}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <RechartsTooltip cursor={false} content={<CustomAveriaTooltip esMismoDia={esMismoDia} />} />
        <Bar dataKey="cantidad" fill={esAnterior ? '#71717a' : '#fd7e14'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="cantidad" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);

export const IncongruenciasChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.incongruenciasArqueo?.length || 0} anchoPorItem={90} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.incongruenciasArqueo} margin={{ top: 20, right: 20, left: 0, bottom: 10 }} barSize={30}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="empleado" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
        <RechartsTooltip cursor={false} content={<CustomArqueoTooltip />} />
        <Bar dataKey="montoDiferencia" fill={esAnterior ? '#71717a' : '#f43f5e'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="montoDiferencia" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" formatter={(val: any) => `$${Number(val || 0).toLocaleString('es-AR')}`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);
