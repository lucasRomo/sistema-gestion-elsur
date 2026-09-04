import React from 'react';

interface TooltipBaseProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  esMismoDia?: boolean;
}

export const CustomAreaTooltip: React.FC<TooltipBaseProps> = ({ active, payload, label, esMismoDia }) => {
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

export const CustomEgresoTooltip: React.FC<TooltipBaseProps> = ({ active, payload, esMismoDia }) => {
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

export const CustomEmpleadoTooltip: React.FC<TooltipBaseProps> = ({ active, payload }) => {
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

interface CustomTiempoTooltipProps extends TooltipBaseProps {
  titulo: string;
}

export const CustomTiempoTooltip: React.FC<CustomTiempoTooltipProps> = ({ active, payload, titulo }) => {
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

export const CustomMermaTooltip: React.FC<TooltipBaseProps> = ({ active, payload, esMismoDia }) => {
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

export const CustomAveriaTooltip: React.FC<TooltipBaseProps> = ({ active, payload, esMismoDia }) => {
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

export const CustomArqueoTooltip: React.FC<TooltipBaseProps> = ({ active, payload }) => {
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

export const CustomDevueltosTooltip: React.FC<TooltipBaseProps> = ({ active, payload }) => {
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

/** Tooltip genérico para pies "Top N" con nombre + valor formateado + una línea secundaria opcional. */
interface CustomRankingTooltipProps {
  active?: boolean;
  payload?: any[];
  colorPorDefecto: string;
  render: (item: any) => React.ReactNode;
}

export const CustomRankingTooltip: React.FC<CustomRankingTooltipProps> = ({ active, payload, colorPorDefecto, render }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const color = item.color || colorPorDefecto;
    return (
      <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${color}`, color: '#fff' }}>
        <p className="fw-bold mb-1" style={{ color }}>{item.name}</p>
        {render(item)}
      </div>
    );
  }
  return null;
};
