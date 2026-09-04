import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, LabelList,
  Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { ChartScrollWrapper } from '../ChartScrollWrapper';
import { crearRendererEtiquetasSinColision, formatearCantidad, normalizarDatosTorta } from '../etiquetasPieSinColision';
import { COLORES_TORTA } from '.././Colores';
import { CustomRankingTooltip } from '../../tooltips/InformesTooltips';
import type { RendererChartProps } from '../../types/informeTypes';

export const EstadosChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.distribucionEstados || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearCantidad, isDark)}
          labelLine={false}
          fontWeight="bold"
        >
          {datosTorta.map((_: any, index: number) => (
            <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const ProductosChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.productosMasVendidos || []);

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
            <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={({ active, payload }: any) => (
            <CustomRankingTooltip
              active={active}
              payload={payload}
              colorPorDefecto="#20c997"
              render={(item) => (
                <p className="small mb-0">Top {item.rank} — Unidades: <span className="text-white fw-bold">{item.value}</span></p>
              )}
            />
          )}
        />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const CategoriasChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.categoriasMasVendidas?.length || 0} anchoPorItem={60} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.categoriasMasVendidas} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: '#18181b', borderColor: '#8e45e0', borderRadius: '8px', color: '#fff' }} />
        <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#8e45e0'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="ventas" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);