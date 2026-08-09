import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface ControlProps {
  metricas: any;
  esMismoDia?: boolean;
  incongruenciasArqueo?: any[];
}

const CustomMermaTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #ffc107', fontSize: '0.85rem' }}>
        <div className="fw-bold text-warning mb-1 border-bottom border-secondary border-opacity-25 pb-1">
          {data.ejeX} - {data.cantidad} un. desperdiciadas
        </div>

        {esMismoDia && (
          <div className="mt-2">
            {data.insumo && (
              <div className="small text-body mb-1">
                <strong className="text-warning">Insumo:</strong> {data.insumo}
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

export const ControlCharts: React.FC<ControlProps> = ({ metricas, esMismoDia = false, incongruenciasArqueo = [] }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#f43f5e' }}>
          <i className="bi bi-shield-check me-2"></i>Control Interno y Auditoría
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-trash-fill me-2" style={{ color: '#ffc107' }}></i>Mermas y Material Desperdiciado
            </h5>
            {metricas.mermasPorPeriodo && metricas.mermasPorPeriodo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.mermasPorPeriodo} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                    <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} content={<CustomMermaTooltip esMismoDia={esMismoDia} />} />
                    <Bar dataKey="cantidad" fill="#ffc107" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No se registraron mermas en este rango.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-journal-x me-2" style={{ color: '#f43f5e' }}></i>Incongruencias en Arqueos de Caja
            </h5>
            {incongruenciasArqueo && incongruenciasArqueo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incongruenciasArqueo} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                    <XAxis dataKey="empleado" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} content={<CustomArqueoTooltip />} />
                    <Bar dataKey="montoDiferencia" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">Sin registro de cierres incongruentes en este rango.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <h5 className="fw-bold mb-3" style={{ color: '#a1a1aa' }}>
              <i className="bi bi-tools me-2" style={{ color: '#fd7e14' }}></i>Fallas y Averías en Máquinas
            </h5>
            {metricas.averiasPorPeriodo && metricas.averiasPorPeriodo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.averiasPorPeriodo} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
                    <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} content={<CustomAveriaTooltip esMismoDia={esMismoDia} />} />
                    <Bar dataKey="cantidad" fill="#fd7e14" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No se registraron fallas mecánicas en este rango.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};