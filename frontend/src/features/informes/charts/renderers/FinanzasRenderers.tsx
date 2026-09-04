import React from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, LabelList,
  Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { ChartScrollWrapper } from '../ChartScrollWrapper';
import { crearRendererEtiquetasSinColision, formatearDinero, normalizarDatosTorta } from '../etiquetasPieSinColision';
import { COLORES_TORTA } from '.././Colores';
import { CustomAreaTooltip, CustomEgresoTooltip, CustomRankingTooltip } from '../../tooltips/InformesTooltips';
import type { RendererChartProps } from '../../types/informeTypes';

export const IngresosChart: React.FC<RendererChartProps> = ({ data, esAnterior = false, esMismoDia }) => {
  const colorBase = esAnterior ? '#71717a' : '#8e45e0';
  return (
    <ChartScrollWrapper cantidadItems={data.ventasPorPeriodo?.length || 0} anchoPorItem={65} height="100%">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
          <defs>
            <linearGradient id={`colorVentas_${esAnterior ? 'ant' : 'act'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorBase} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colorBase} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#a1a1aa"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={15}
            interval={0}
            angle={-25}
          />
          <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
          <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
          <Area type="monotone" dataKey="ventas" stroke={colorBase} strokeWidth={3} fillOpacity={1} fill={`url(#colorVentas_${esAnterior ? 'ant' : 'act'})`} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartScrollWrapper>
  );
};

export const MediosPagoChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.distribucionMediosPago || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearDinero, isDark)}
          labelLine={false}
          fontSize={12}
          fontWeight="bold"
        >
          {datosTorta.map((_: any, index: number) => (
            <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const EgresosChart: React.FC<RendererChartProps> = ({ data, esAnterior = false, esMismoDia }) => (
  <ChartScrollWrapper cantidadItems={data.detalleEgresos?.length || 0} anchoPorItem={70} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.detalleEgresos} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
        <RechartsTooltip cursor={false} content={<CustomEgresoTooltip esMismoDia={esMismoDia} />} />
        <Bar dataKey="monto" fill={esAnterior ? '#71717a' : '#e22e2e'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="monto" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" formatter={(val: any) => `$${Number(val || 0).toLocaleString('es-AR')}`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);

export const CategoriasIngresosChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.distribucionCategoriasIngreso || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearDinero, isDark)}
          labelLine={false}
          fontSize={12}
          fontWeight="bold"
        >
          {datosTorta.map((entry: any, index: number) => (
            <Cell key={`cell-cat-ing-${index}`} fill={entry.color || COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={({ active, payload }: any) => (
            <CustomRankingTooltip
              active={active}
              payload={payload}
              colorPorDefecto="#8e45e0"
              render={(item) => (
                <>
                  <p className="small mb-1 text-white">Monto Total: <span className="fw-bold">${Number(item.value).toLocaleString('es-AR')}</span></p>
                  <p className="small mb-0">Movimientos: {item.cantidad}</p>
                </>
              )}
            />
          )}
        />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const CategoriasEgresosChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.distribucionCategoriasEgreso || []);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
      <PieChart>
        <Pie
          data={datosTorta}
          cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="valorGrafico" stroke="none"
          label={crearRendererEtiquetasSinColision(datosTorta, formatearDinero, isDark)}
          labelLine={false}
          fontSize={12}
          fontWeight="bold"
        >
          {datosTorta.map((entry: any, index: number) => (
            <Cell key={`cell-cat-egr-${index}`} fill={entry.color || COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={({ active, payload }: any) => (
            <CustomRankingTooltip
              active={active}
              payload={payload}
              colorPorDefecto="#e22e2e"
              render={(item) => (
                <>
                  <p className="small mb-1 text-white">Monto Total: <span className="fw-bold">${Number(item.value).toLocaleString('es-AR')}</span></p>
                  <p className="small mb-0">Movimientos: {item.cantidad}</p>
                </>
              )}
            />
          )}
        />
        <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};