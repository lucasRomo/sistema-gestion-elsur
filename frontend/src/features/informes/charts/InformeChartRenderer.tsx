import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

import type { InformeComparacion } from '../types/informeTypes';

// Paleta de colores reutilizable para gráficos de torta
export const COLORES_TORTA = [
  '#8e45e0', '#20c997', '#ffc107', '#0dcaf0', '#fd7e14',
  '#e83e8c', '#6f42c1', '#198754', '#d63384', '#0d6efd'
];

export interface InformeChartRendererProps {
  informe: InformeComparacion | null;
  data: any;
  esAnterior?: boolean;
  esMismoDia?: boolean;
}

// --- TOOLTIPS PERSONALIZADOS ---

const CustomAreaTooltip = ({ active, payload, label, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #8e45e0', color: '#fff' }}>
        <p className="fw-bold mb-1 text-purple">{label}</p>
        <p className="small mb-0">
          Ventas: <span className="fw-bold text-white">${Number(payload[0].value || 0).toLocaleString('es-AR')}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomEgresoTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #e22e2e', color: '#fff' }}>
        <p className="fw-bold mb-1 text-danger">{label}</p>
        <p className="small mb-0">
          Monto Egreso: <span className="fw-bold text-white">${Number(payload[0].value || 0).toLocaleString('es-AR')}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomEmpleadoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #0dcaf0', color: '#fff' }}>
        <p className="fw-bold mb-1 style-info" style={{ color: '#0dcaf0' }}>{item.name}</p>
        <p className="small mb-0">Recaudado: <span className="fw-bold text-white">${Number(item.ventas || 0).toLocaleString('es-AR')}</span></p>
      </div>
    );
  }
  return null;
};

// --- RENDERIZADOR PRINCIPAL ---

export const InformeChartRenderer: React.FC<InformeChartRendererProps> = ({
  informe,
  data,
  esAnterior = false,
  esMismoDia = false
}) => {
  if (!data || !informe) return null;

  const colorBase = esAnterior ? '#71717a' : '#8e45e0';

  switch (informe) {
    case 'ingresos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
            <defs>
              <linearGradient id={`colorVentas_${esAnterior ? 'ant' : 'act'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorBase} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colorBase} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
            <Area type="monotone" dataKey="ventas" stroke={colorBase} strokeWidth={3} fillOpacity={1} fill={`url(#colorVentas_${esAnterior ? 'ant' : 'act'})`} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'mediosPago':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.distribucionMediosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
              {data.distribucionMediosPago?.map((_: any, index: number) => (
                <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'egresos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.detalleEgresos} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEgresoTooltip esMismoDia={esMismoDia} />} />
            <Bar dataKey="monto" fill={esAnterior ? '#71717a' : '#e22e2e'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'estados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.distribucionEstados} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.distribucionEstados?.map((_: any, index: number) => (
                <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'productos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.productosMasVendidos} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.productosMasVendidos?.map((_: any, index: number) => (
                <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const colorSlice = item.color || '#20c997';
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.nombreReal || item.name}</p>
                      <p className="small mb-0">{item.name} — Unidades: <span className="text-white fw-bold">{item.value}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categorias':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.categoriasMasVendidas} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <RechartsTooltip cursor={{ fill: '#222122' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#8e45e0', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#8e45e0'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'recaudacionEmpleados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEmpleadoTooltip />} />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#0dcaf0'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pedidosEmpleados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.pedidosCompletadosPorEmpleado} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.pedidosCompletadosPorEmpleado?.map((_: any, index: number) => (
                <Cell key={`cell-emp-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'clientes':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.topClientes} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="totalGastado" stroke="none">
              {data.topClientes?.map((_: any, index: number) => (
                <Cell key={`cell-cliente-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const colorSlice = item.color || '#ffc107';
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.nombreReal || item.name}</p>
                      <p className="small mb-1 text-white">Total Pagado: <span className="fw-bold">${Number(item.totalGastado).toLocaleString('es-AR')}</span></p>
                      <p className="small mb-0 text-white-50">Pedidos creados: {item.cantidadPedidos}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categoriasCliente':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.ventasPorCategoriaCliente} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <RechartsTooltip
              cursor={{ fill: '#222122' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #20c997', color: '#fff' }}>
                      <p className="fw-bold mb-1 text-success">{item.name}</p>
                      <p className="small mb-1 text-white">Pedidos: <span className="fw-bold">{item.ventas}</span></p>
                      <p className="small mb-0 text-white-50">Monto total: <span className="fw-bold text-white">${Number(item.montoTotal || 0).toLocaleString('es-AR')}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#20c997'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
};
export default InformeChartRenderer;