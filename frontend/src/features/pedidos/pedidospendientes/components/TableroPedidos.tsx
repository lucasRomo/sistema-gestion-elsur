import React, { useState } from 'react';
import { useTheme } from '../../../../Context/ThemeContext';
import { ContadorTiempo } from './ContadorTiempo';
import { colorEstado } from '../../../../components/common/estadoPedido';
import { resolverEmpleadoGestion } from '../../../../utils/formato';

// Vista tablero (kanban) del taller: una columna por estado. Arrastrar una tarjeta a otra
// columna abre el mismo flujo de cambio de estado que el desplegable de la lista (con su
// confirmación y observaciones), así que no se saltea ninguna validación.

const COLUMNAS = [
  { estado: 'PENDIENTE', titulo: 'Pendiente' },
  { estado: 'EN PROCESO', titulo: 'En proceso' },
  { estado: 'PAUSADO', titulo: 'Pausado' },
  { estado: 'FINALIZADO', titulo: 'Finalizado' },
];

interface Props {
  pedidos: any[];
  onMover: (pedido: any, estadoDestino: string) => void;
}

const nombreCliente = (p: any) =>
  p.cliente?.persona
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.razonSocial || p.cliente?.nombre || 'Consumidor Final');

export const TableroPedidos: React.FC<Props> = ({ pedidos, onMover }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [columnaDestacada, setColumnaDestacada] = useState<string | null>(null);

  const columnaBg = isDark ? '#121214' : '#f1f5f9';
  const tarjetaBg = isDark ? '#1a1a1c' : '#ffffff';
  const borde = isDark ? '#27272a' : '#e2e8f0';
  const textoSuave = isDark ? '#a1a1aa' : '#64748b';

  const soltar = (e: React.DragEvent, estadoDestino: string) => {
    e.preventDefault();
    setColumnaDestacada(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    const pedido = pedidos.find(p => p.id_pedido === id);
    if (pedido && pedido.estado !== estadoDestino) onMover(pedido, estadoDestino);
  };

  const zonaSoltar = (estado: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setColumnaDestacada(estado); },
    onDragLeave: () => setColumnaDestacada(prev => (prev === estado ? null : prev)),
    onDrop: (e: React.DragEvent) => soltar(e, estado),
  });

  return (
    <div className="d-flex gap-2 font-monospace" style={{ minHeight: '100%', overflowX: 'auto' }}>
      {COLUMNAS.map(col => {
        const pedidosColumna = pedidos.filter(p =>
          col.estado === 'PENDIENTE'
            ? !COLUMNAS.slice(1).some(c => c.estado === p.estado)
            : p.estado === col.estado);
        const color = colorEstado(col.estado, isDark);
        const destacada = columnaDestacada === col.estado;

        return (
          <div
            key={col.estado}
            {...zonaSoltar(col.estado)}
            className="d-flex flex-column rounded-3 p-2"
            style={{
              flex: '1 1 0', minWidth: '230px', backgroundColor: columnaBg,
              border: `1px ${destacada ? 'dashed' : 'solid'} ${destacada ? color : borde}`,
              transition: 'border-color 0.15s'
            }}
          >
            <div className="d-flex justify-content-between align-items-center px-1 mb-2">
              <span className="fw-bold small" style={{ color }}>{col.titulo}</span>
              <span className="badge rounded-pill" style={{ backgroundColor: borde, color: textoSuave }}>{pedidosColumna.length}</span>
            </div>

            <div className="d-flex flex-column gap-2" style={{ overflowY: 'auto' }}>
              {pedidosColumna.map(p => (
                <div
                  key={p.id_pedido}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(p.id_pedido))}
                  className="rounded-2 p-2 shadow-sm"
                  style={{ backgroundColor: tarjetaBg, border: `1px solid ${borde}`, borderLeft: `3px solid ${color}`, cursor: 'grab' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-info small">#{p.id_pedido}</span>
                    <span style={{ fontSize: '0.72rem' }}><ContadorTiempo fechaEstimadaIso={p.fecha_entrega_estimada} /></span>
                  </div>
                  <div className="fw-semibold text-truncate" style={{ fontSize: '0.85rem' }} title={nombreCliente(p)}>{nombreCliente(p)}</div>
                  <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: '0.72rem', color: textoSuave }}>
                    <span className="text-truncate"><i className="bi bi-person me-1" aria-hidden="true"></i>{resolverEmpleadoGestion(p)}</span>
                    <span>${Number(p.monto_total ?? 0).toFixed(2)}</span>
                  </div>
                  {/* Alternativa al arrastre (pantallas táctiles): mover desde un desplegable */}
                  <select
                    className={`form-select form-select-sm mt-2 py-0 ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
                    style={{ fontSize: '0.72rem' }}
                    value=""
                    aria-label={`Mover pedido ${p.id_pedido}`}
                    onChange={(e) => e.target.value && onMover(p, e.target.value)}
                  >
                    <option value="">Mover a…</option>
                    {COLUMNAS.filter(c => c.estado !== p.estado).map(c => (
                      <option key={c.estado} value={c.estado}>{c.titulo}</option>
                    ))}
                    <option value="ENTREGADO">Entregar</option>
                  </select>
                </div>
              ))}
              {pedidosColumna.length === 0 && (
                <div className="text-center small py-3 rounded-2" style={{ color: textoSuave, border: `1px dashed ${borde}` }}>
                  Arrastrá un pedido acá
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div
        {...zonaSoltar('ENTREGADO')}
        className="d-flex flex-column align-items-center justify-content-center rounded-3 p-2 text-center"
        style={{
          flex: '0 0 130px', backgroundColor: columnaBg,
          border: `1px dashed ${columnaDestacada === 'ENTREGADO' ? colorEstado('ENTREGADO', isDark) : borde}`,
          color: colorEstado('ENTREGADO', isDark)
        }}
      >
        <i className="bi bi-box-arrow-right fs-3" aria-hidden="true"></i>
        <span className="small fw-bold mt-1">Entregar</span>
        <span style={{ fontSize: '0.7rem', color: textoSuave }}>Soltá acá para entregar al cliente</span>
      </div>
    </div>
  );
};
