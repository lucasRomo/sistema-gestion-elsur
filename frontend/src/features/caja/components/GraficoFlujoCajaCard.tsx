import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { MovimientoCaja } from '../types/caja';

interface GraficoFlujoCajaCardProps {
  cajaAbierta: boolean;
  movimientos: MovimientoCaja[];
  cardBg: string;
  cardBorder: string;
  shadowStyle: string;
  graphInnerBg: string;
  chartGrid: string;
  chartTick: string;
  dotColor: string;
}

const CustomCajaAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const esEgreso = data.esEgreso;
    return (
      <div
        className="p-2 rounded-3 shadow-lg im-surface"
        style={{ border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, fontSize: '0.85rem' }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
          <span className="fw-bold text-body-secondary">{label}</span>
          <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
            {esEgreso
              ? `- $${Math.abs(data.montoMovimiento).toLocaleString('es-AR')}`
              : `+ $${Math.abs(data.montoMovimiento).toLocaleString('es-AR')}`}
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-body-secondary">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>
            ${data.monto.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const GraficoFlujoCajaCard: React.FC<GraficoFlujoCajaCardProps> = ({
  cajaAbierta,
  movimientos,
  cardBg,
  cardBorder,
  shadowStyle,
  graphInnerBg,
  chartGrid,
  chartTick,
  dotColor
}) => {
  return (
    <div className="col-md-6">
      <div className="p-4 rounded-3 h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: shadowStyle }}>
        <div className="p-3 rounded" style={{ backgroundColor: graphInnerBg, border: `1px solid ${cardBorder}`, minHeight: '180px', overflowX: 'auto' }}>
          <div className="text-center small opacity-50 mb-2 font-monospace">
            {new Date().toLocaleDateString('es-AR')}
          </div>

          <div style={{ width: movimientos.length > 5 ? `${movimientos.length * 80}px` : '100%', height: '140px', minWidth: '100%' }}>
            {cajaAbierta && movimientos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[...movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                  .map(m => {
                    const esEgreso = m.tipoMovimiento === 'EGRESO';
                    return {
                      hora: new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                      monto: esEgreso ? -Math.abs(m.monto) : m.monto,
                      esEgreso,
                      montoMovimiento: m.monto
                    };
                  })}
                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorSaldoCaja" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8e45e0" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8e45e0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="hora" tick={{ fill: chartTick, fontSize: 11, dy: 15 }} axisLine={{ stroke: chartGrid }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomCajaAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="monto"
                    stroke="#8e45e0"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSaldoCaja)"
                    dot={{ fill: dotColor, stroke: dotColor, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted small opacity-50" style={{ minHeight: '140px' }}>
                <i className="bi bi-graph-up-arrow me-2"></i> No hay datos disponibles para graficar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
