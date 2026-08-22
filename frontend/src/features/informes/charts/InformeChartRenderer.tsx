import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

import type { TipoGraficoInforme } from '../types/informeTypes';
import { ChartScrollWrapper } from './ChartScrollWrapper';
import { crearRendererEtiquetasSinColision, formatearDinero, formatearCantidad } from './etiquetasPieSinColision';
import { useTheme } from '../../../Context/ThemeContext';

export const COLORES_TORTA = [
  '#8e45e0', '#20c997', '#ffc107', '#0dcaf0', '#fd7e14',
  '#e83e8c', '#6f42c1', '#198754', '#d63384', '#0d6efd'
];

export interface InformeChartRendererProps {
  informe: TipoGraficoInforme | null;
  data: any;
  esAnterior?: boolean;
  esMismoDia?: boolean;
}

const labelDinero = ({ name, value }: any) => `${name}: $${Number(value || 0).toLocaleString('es-AR')}`;
const labelCantidad = ({ name, value }: any) => `${name}: ${value}`;

const CustomAreaTooltip = ({ active, payload, label, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const saldoAcumulado = payload[0].value;
    const esEgreso = data.esEgreso;
    const montoMovimiento = data.montoMovimiento || 0;

    return (
      <div
        className="p-2 rounded-3 shadow-lg im-surface"
        style={{ border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, fontSize: '0.85rem' }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
          <span className="fw-bold text-body-secondary">{label}</span>
          {esMismoDia && (
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso
                ? `- $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`
                : `+ $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-body-secondary">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>
            ${saldoAcumulado.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomEgresoTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #e22e2e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-body-secondary mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.ejeX}
        </div>
        <div className="fw-bold text-danger mb-1">
          Total Egreso: - ${Math.abs(data.monto).toLocaleString('es-AR')}
        </div>
        {esMismoDia && (
          <div className="small text-body-secondary">
            <strong className="text-body">Razón / Desc:</strong> {data.descripcion || 'Sin descripción'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomEmpleadoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #0dcaf0', fontSize: '0.85rem' }}>
        <div className="fw-bold text-info mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {item.name}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Ventas / Recaudación:</strong> ${Number(item.ventas || 0).toLocaleString('es-AR')}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Pedidos completados:</strong> {item.pedidosCompletados || 0}
        </div>
      </div>
    );
  }
  return null;
};

const CustomTiempoTooltip = ({ active, payload, titulo }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const minutos = Number(item.valor || 0);
    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;
    const tiempoFormateado = horas > 0 ? `${horas}h ${minRestantes}m` : `${minutos} min`;

    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #0dcaf0', fontSize: '0.85rem' }}>
        <div className="fw-bold mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {item.name}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">{titulo}:</strong> {minutos} min ({tiempoFormateado})
        </div>
      </div>
    );
  }
  return null;
};

const CustomMermaTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #ffc107', fontSize: '0.85rem' }}>
        <div className="fw-bold text-warning mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.horaLabel || data.ejeX} - {data.cantidad} un. desperdiciadas
        </div>
        {esMismoDia && (
          <div className="mt-2">
            {data.insumo && (
              <div className="small text-body mb-1">
                <strong className="text-warning">Insumo:</strong> {data.insumo}
              </div>
            )}
            {data.producto && (
              <div className="small text-body mb-1">
                <strong className="text-warning">Producto:</strong> {data.producto}
              </div>
            )}
            {data.empleado && (
              <div className="small text-body mb-1">
                <strong className="text-warning">Empleado:</strong> {data.empleado}
              </div>
            )}
            {data.motivo && (
              <div className="small text-body-secondary">
                <strong className="text-warning">Motivo:</strong> {data.motivo}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomAveriaTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #fd7e14', fontSize: '0.85rem' }}>
        <div className="fw-bold mb-1 border-bottom border-secondary border-opacity-25 pb-1" style={{ color: '#fd7e14' }}>
          {data.ejeX} - {data.cantidad} avería(s)
        </div>
        {esMismoDia && (
          <>
            <div className="small text-body-secondary">
              <strong className="text-body">Equipo:</strong> {data.maquina || 'No especificado'}
            </div>
            <div className="small text-body-secondary">
              <strong className="text-body">Falla:</strong> {data.detalle || 'Sin detalle'}
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomArqueoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #f43f5e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-body mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.empleado}
        </div>
        <div className="text-danger fw-bold mb-1">
          Total Faltante / Ajuste: ${Number(data.montoDiferencia || 0).toLocaleString('es-AR')}
        </div>
        <div className="small text-body-secondary">
          Incongruencias detectadas: {data.cantidadIncongruencias}
        </div>
      </div>
    );
  }
  return null;
};

const CustomDevueltosTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #e22e2e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-danger mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {item.name}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Pedidos Devueltos / Cancelados:</strong> {item.value || 0}
        </div>
      </div>
    );
  }
  return null;
};

export const InformeChartRenderer: React.FC<InformeChartRendererProps> = ({
  informe,
  data,
  esAnterior = false,
  esMismoDia = false
}) => {
  if (!data || !informe) return null;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colorBase = esAnterior ? '#71717a' : '#8e45e0';

  switch (informe) {
    case 'ingresos':
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

    case 'mediosPago':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.distribucionMediosPago} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.distribucionMediosPago, formatearDinero, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.distribucionMediosPago?.map((_: any, index: number) => (
                <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'egresos':
      return (
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

    case 'estados':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.distribucionEstados} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.distribucionEstados, formatearCantidad, isDark)}
              labelLine={false}
              fontWeight="bold"
            >
              {data.distribucionEstados?.map((_: any, index: number) => (
                <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'productos':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.productosMasVendidos} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.productosMasVendidos, formatearCantidad, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
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
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.name}</p>
                      <p className="small mb-0">Top {item.rank} — Unidades: <span className="text-white fw-bold">{item.value}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categorias':
      return (
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

    case 'recaudacionEmpleados':
      return (
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

    case 'pedidosEmpleados':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.pedidosCompletadosPorEmpleado} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.pedidosCompletadosPorEmpleado, formatearCantidad, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.pedidosCompletadosPorEmpleado?.map((_: any, index: number) => (
                <Cell key={`cell-emp-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'pedidosdevueltosempleado':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.pedidosDevueltosPorEmpleado} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.pedidosDevueltosPorEmpleado, formatearCantidad, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.pedidosDevueltosPorEmpleado?.map((entry: any, index: number) => (
                <Cell key={`cell-dev-${index}`} fill={entry.color || COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomDevueltosTooltip />} />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'tiempoMaximoEmpleado':
      return (
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

    case 'tiempoPromedioPedido':
      return (
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

    case 'clientes':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.topClientes} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="totalGastado" stroke="none"
              label={crearRendererEtiquetasSinColision(data.topClientes, formatearDinero, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
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
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.name}</p>
                      <p className="small mb-1 text-white">Top {item.rank} — Total Pagado: <span className="fw-bold">${Number(item.totalGastado).toLocaleString('es-AR')}</span></p>
                      <p className="small mb-0 text-white-50">Pedidos creados: {item.cantidadPedidos}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

      case 'deudores':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie 
              data={data.topDeudores} 
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="saldoDeudor" stroke="none"
              label={crearRendererEtiquetasSinColision(data.topDeudores, formatearDinero, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.topDeudores?.map((_: any, index: number) => (
                <Cell key={`cell-deudor-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const colorSlice = item.color || '#f43f5e';
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.name}</p>
                      <p className="small mb-1 text-white">
                        Debe: <span className="fw-bold text-danger">${Number(item.saldoDeudor).toLocaleString('es-AR')}</span>
                      </p>
                      <p className="small mb-1 text-white">
                        Ya pagó: <span className="fw-bold text-success">${Number(item.totalPagado).toLocaleString('es-AR')}</span>
                      </p>
                      <p className="small mb-0 text-white-50">
                        Límite registrado: ${Number(item.limiteCredito).toLocaleString('es-AR')}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categoriasCliente':
      return (
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

    case 'mermas':
      return (
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

    case 'averias':
      return (
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

    case 'incongruencias':
      return (
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

    case 'categoriasIngresos':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={data.distribucionCategoriasIngreso}
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.distribucionCategoriasIngreso, formatearDinero, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.distribucionCategoriasIngreso?.map((entry: any, index: number) => (
                <Cell key={`cell-cat-ing-${index}`} fill={entry.color || COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${item.color}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: item.color }}>{item.name}</p>
                      <p className="small mb-1 text-white">Monto Total: <span className="fw-bold">${Number(item.value).toLocaleString('es-AR')}</span></p>
                      <p className="small mb-0">Movimientos: {item.cantidad}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categoriasEgresos':
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={data.distribucionCategoriasEgreso}
              cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none"
              label={crearRendererEtiquetasSinColision(data.distribucionCategoriasEgreso, formatearDinero, isDark)}
              labelLine={false}
              fontSize={12}
              fontWeight="bold"
            >
              {data.distribucionCategoriasEgreso?.map((entry: any, index: number) => (
                <Cell key={`cell-cat-egr-${index}`} fill={entry.color || COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${item.color}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: item.color }}>{item.name}</p>
                      <p className="small mb-1 text-white">Monto Total: <span className="fw-bold">${Number(item.value).toLocaleString('es-AR')}</span></p>
                      <p className="small mb-0">Movimientos: {item.cantidad}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa', overflowY: 'auto', maxHeight: '60px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
};

export default InformeChartRenderer;