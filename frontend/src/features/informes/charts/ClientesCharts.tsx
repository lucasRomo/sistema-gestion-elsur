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

interface ClientesProps {
  metricas: any;
  topClientes?: any[];
  abrirModalComparacion: (informe: string) => void;
}

export const ClientesCharts: React.FC<ClientesProps> = ({ metricas, topClientes = [], abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#ffc107' }}>
          <i className="bi bi-trophy-fill me-2"></i>Clientes
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-trophy-fill me-2" style={{ color: '#ffc107' }}></i>Clientes Más Activos
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('clientes')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>

            {topClientes && topClientes.length > 0 ? (
              <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topClientes} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="totalGastado" stroke="none">
                      {topClientes.map((_: any, index: number) => (
                        <Cell key={`cell-cliente-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const colorSlice = data.color || '#ffc107';
                          return (
                            <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#fff', border: `1px solid ${colorSlice}`, color: '#000' }}>
                              <p className="fw-bold mb-1" style={{ color: colorSlice }}>{data.nombreReal || data.name}</p>
                              <p className="small mb-1">Total Pagado: <span className="fw-bold">${Number(data.totalGastado).toLocaleString('es-AR')}</span></p>
                              <p className="small mb-0 text-muted">Pedidos creados: {data.cantidadPedidos}</p>
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
            ) : (
              <div className="text-white-50 text-center py-4">No hay datos suficientes de clientes en el período.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-people me-2" style={{ color: '#20c997' }}></i>Ventas por Categoría de Cliente
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('categoriasCliente')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>

            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.ventasPorCategoriaCliente} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#fff', border: '1px solid #20c997', color: '#000' }}>
                            <p className="fw-bold mb-1 text-success">{item.name}</p>
                            <p className="small mb-1">Pedidos solicitados: <span className="fw-bold">{item.ventas}</span></p>
                            <p className="small mb-0 text-muted">Monto total: <span className="fw-bold">${Number(item.montoTotal || 0).toLocaleString('es-AR')}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="ventas" fill="#20c997" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};