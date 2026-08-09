import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

interface FinanzasProps {
  metricas: any;
  esMismoDia?: boolean;
  abrirModalComparacion: (informe: string) => void;
}

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

export const FinanzasCharts: React.FC<FinanzasProps> = ({ metricas, esMismoDia = false, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#8e45e0' }}>
          <i className="bi bi-wallet2 me-2"></i>Finanzas y Caja
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos a Caja
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('ingresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #8e45e0', color: '#8e45e0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricas.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8e45e0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={15} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
                  <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
                  <Area type="monotone" dataKey="ventas" stroke="#8e45e0" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Tipos / Medios de Pago
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('mediosPago')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto d-flex align-items-center justify-content-center" style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metricas.distribucionMediosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {metricas.distribucionMediosPago?.map((_: any, index: number) => (
                      <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="p-4 rounded-4 shadow-sm im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-arrow-down-right-circle-fill me-2" style={{ color: '#e22e2e' }}></i>Egresos y Salidas de Caja Detallados
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('egresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #e22e2e', color: '#e22e2e' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {metricas.detalleEgresos && metricas.detalleEgresos.length > 0 ? (
              <div style={{ height: '280px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.detalleEgresos} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                    <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} content={<CustomEgresoTooltip esMismoDia={esMismoDia} />} />
                    <Bar dataKey="monto" fill="#e22e2e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No hay egresos registrados en el período seleccionado.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};