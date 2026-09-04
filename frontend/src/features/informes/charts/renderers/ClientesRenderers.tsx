import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, LabelList,
  Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { ChartScrollWrapper } from '../ChartScrollWrapper';
import { crearRendererEtiquetasSinColision, formatearDinero, normalizarDatosTorta } from '../etiquetasPieSinColision';
import { COLORES_TORTA } from '.././Colores';
import { CustomRankingTooltip } from '../../tooltips/InformesTooltips';
import type { RendererChartProps } from '../../types/informeTypes';

export const ClientesChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.topClientes || []);

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
            <Cell key={`cell-cliente-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={({ active, payload }: any) => (
            <CustomRankingTooltip
              active={active}
              payload={payload}
              colorPorDefecto="#ffc107"
              render={(item) => (
                <>
                  <p className="small mb-1 text-white">Top {item.rank} — Total Pagado: <span className="fw-bold">${Number(item.totalGastado).toLocaleString('es-AR')}</span></p>
                  <p className="small mb-0 text-white-50">Pedidos creados: {item.cantidadPedidos}</p>
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

export const DeudoresChart: React.FC<RendererChartProps> = ({ data, isDark, isMobile }) => {
  const datosTorta = normalizarDatosTorta(data.topDeudores || []);

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
            <Cell key={`cell-deudor-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={({ active, payload }: any) => (
            <CustomRankingTooltip
              active={active}
              payload={payload}
              colorPorDefecto="#f43f5e"
              render={(item) => (
                <>
                  <p className="small mb-1 text-white">
                    Debe: <span className="fw-bold text-danger">${Number(item.saldoDeudor).toLocaleString('es-AR')}</span>
                  </p>
                  <p className="small mb-1 text-white">
                    Ya pagó: <span className="fw-bold text-success">${Number(item.totalPagado).toLocaleString('es-AR')}</span>
                  </p>
                  <p className="small mb-0 text-white-50">
                    Límite registrado: ${Number(item.limiteCredito).toLocaleString('es-AR')}
                  </p>
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

export const CategoriasClienteChart: React.FC<RendererChartProps> = ({ data, esAnterior = false }) => (
  <ChartScrollWrapper cantidadItems={data.ventasPorCategoriaCliente?.length || 0} anchoPorItem={90} height="100%">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.ventasPorCategoriaCliente} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
        <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <RechartsTooltip
          cursor={false}
          content={({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #20c997', color: '#fff' }}>
                  <p className="fw-bold mb-1 text-success">{item.name}</p>
                  <p className="small mb-1 text-white">Pedidos: <span className="fw-bold">{item.ventas}</span></p>
                  <p className="small mb-0 text-white-50">Monto total Generado: <span className="fw-bold text-white">${Number(item.montoTotal || 0).toLocaleString('es-AR')}</span></p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#20c997'} radius={[6, 6, 0, 0]}>
          <LabelList dataKey="ventas" position="top" fill="#a1a1aa" fontSize={14} fontWeight="bold" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartScrollWrapper>
);