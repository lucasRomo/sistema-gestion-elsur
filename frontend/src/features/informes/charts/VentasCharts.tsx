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

interface VentasProps {
  metricas: any;
  abrirModalComparacion: (informe: string) => void;
}

export const VentasCharts: React.FC<VentasProps> = ({ metricas, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#20c997' }}>
          <i className="bi bi-bag-check-fill me-2"></i>Ventas y Productos
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-diagram-3-fill me-2" style={{ color: '#ffc107' }}></i>Distribución por Estados
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('estados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metricas.distribucionEstados} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                    {metricas.distribucionEstados?.map((_: any, index: number) => (
                      <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#000' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-box-seam-fill me-2" style={{ color: '#20c997' }}></i>Productos Más Vendidos
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('productos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metricas?.productosMasVendidos || []} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                    {(metricas?.productosMasVendidos || []).map((_: any, index: number) => (
                      <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const colorSlice = data.color || '#20c997';
                        return (
                          <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#fff', border: `1px solid ${colorSlice}`, color: '#000' }}>
                            <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.nombreReal || data.name}</p>
                            <p className="small mb-0">{data.name} — Unidades vendidas: <span className="fw-bold">{data.value}</span></p>
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

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tags-fill me-2" style={{ color: '#8e45e0' }}></i>Categorías Más Vendidas
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('categorias')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #8e45e0', color: '#8e45e0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas?.categoriasMasVendidas || []} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#8e45e0', borderRadius: '8px', color: '#000' }} />
                  <Bar dataKey="ventas" fill="#8e45e0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};