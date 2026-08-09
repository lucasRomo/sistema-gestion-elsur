import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

interface OperacionesProps {
  metricas: any;
  abrirModalComparacion: (informe: string) => void;
}

const CustomEmpleadoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #0dcaf0', fontSize: '0.85rem' }}>
        <div className="fw-bold text-info mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.name}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Ventas / Recaudación:</strong> ${Number(data.ventas || 0).toLocaleString('es-AR')}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Pedidos completados:</strong> {data.pedidosCompletados || 0}
        </div>
      </div>
    );
  }
  return null;
};

export const OperacionesCharts: React.FC<OperacionesProps> = ({ metricas, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#0dcaf0' }}>
          <i className="bi bi-people-fill me-2"></i>Operaciones y Recursos Humanos
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Recaudación de Empleado por Pago Completado
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('recaudacionEmpleados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #0dcaf0', color: '#0dcaf0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} content={<CustomEmpleadoTooltip />} />
                  <Bar dataKey="ventas" fill="#0dcaf0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-check2-square me-2" style={{ color: '#0dcaf0' }}></i>Pedidos Completados por Empleado
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('pedidosEmpleados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #0dcaf0', color: '#0dcaf0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metricas.pedidosCompletadosPorEmpleado} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                    {(metricas.pedidosCompletadosPorEmpleado || []).map((_: any, index: number) => (
                      <Cell key={`cell-emp-completado-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const colorSlice = data.color || '#0dcaf0';
                        return (
                          <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#fff', border: `1px solid ${colorSlice}`, color: '#000', fontSize: '0.85rem' }}>
                            <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.name}</p>
                            <p className="small mb-0">Pedidos finalizados: <span className="fw-bold">{data.value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};