import React from 'react';
import type { MovimientoCaja } from '../types/caja';
import { renderBadgeCategoria } from './RenderBadgeCategoria';

interface TablaMovimientosCajaProps {
  movimientos: MovimientoCaja[];
  isDark: boolean;
  tableWrapBg: string;
  cardBorder: string;
  shadowStyle: string;
  theadBg: string;
  onVerComprobante: (url: string) => void;
  onVerTicket: (movimiento: any) => void;
}

export const TablaMovimientosCaja: React.FC<TablaMovimientosCajaProps> = ({
  movimientos,
  isDark,
  tableWrapBg,
  cardBorder,
  shadowStyle,
  theadBg,
  onVerComprobante,
  onVerTicket
}) => {
  return (
    <div className="col-lg-9 d-flex flex-column">
      <h5 className="mb-3 fw-semibold">Registro de Movimientos de Caja</h5>

      <div className="p-3 rounded-3 d-flex flex-column" style={{ backgroundColor: tableWrapBg, border: `1px solid ${cardBorder}`, boxShadow: shadowStyle, height: '315px' }}>
        <div className="table-responsive flex-grow-1" style={{ backgroundColor: tableWrapBg, height: '100%', overflowY: 'auto' }}>
          <table className="table table-hover m-0 align-middle text-center" style={{ '--bs-table-bg': tableWrapBg, '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.075)', color: isDark ? '#fff' : 'inherit' } as React.CSSProperties}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
              <tr className="text-muted border-secondary" style={{ fontSize: '0.9rem' }}>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '140px' }}>Fecha/Hora</th>
                <th style={{ width: '90px' }}>Monto</th>
                <th style={{ width: '110px' }}>Método</th>
                <th style={{ width: '120px' }}>Categoría</th>
                <th className="text-start">Descripción</th>
                <th style={{ width: '60px' }}>Usu.</th>
                <th style={{ width: '60px' }}>Ped.</th>
                <th style={{ width: '120px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr><td colSpan={9} className="py-5 opacity-50">No hay movimientos registrados hoy</td></tr>
              ) : (
                [...movimientos].reverse().map((m, idx) => {
                  const imagenAdjunta =
                    m.comprobanteImagen ||
                    m.comprobante ||
                    m.imagenComprobante ||
                    m.comprobante_imagen ||
                    m.imagen_comprobante ||
                    m.urlComprobante ||
                    m.url_comprobante;

                  return (
                    <tr key={m.id_movimiento || m.idMovimiento || idx} className="border-secondary" style={{ fontSize: '0.95rem' }}>
                      <td className="fw-bold opacity-75">
                        #{m.id_movimiento || m.idMovimiento || '-'}
                      </td>
                      <td>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                      <td className={`fw-bold ${m.tipoMovimiento === 'EGRESO' ? 'text-danger' : 'text-success'}`}>
                        {m.tipoMovimiento === 'EGRESO' ? '-' : '+'}${Number(m.monto).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge bg-secondary font-monospace">
                          {m.metodoPago || 'EFECTIVO'}
                        </span>
                      </td>
                      <td>{renderBadgeCategoria(m, isDark)}</td>

                      <td>
                        <div
                          className="text-start"
                          style={{ wordBreak: 'break-word', minWidth: '180px' }}
                          title={m.descripcion || 'Sin descripción'}
                        >
                          {m.descripcion || '-'}
                        </div>
                      </td>

                      <td>
                        {(() => {
                          const u = m.usuario;

                          if (u && typeof u === 'object') {
                            const nombreCompleto = `${u.nombre || u.first_name || ''} ${u.apellido || u.last_name || ''}`.trim();
                            if (nombreCompleto) return nombreCompleto;

                            if (u.nombreUsuario) return u.nombreUsuario;
                            if (u.username) return u.username;
                            if (u.nombre_usuario) return u.nombre_usuario;
                          }

                          if (typeof u === 'string' && isNaN(Number(u))) {
                            return u;
                          }

                          return 'Usuario no disponible';
                        })()}
                      </td>
                      <td>
                        {m.pedido?.idPedido || m.pedido?.id_pedido
                          ? `#${m.pedido?.idPedido || m.pedido?.id_pedido}`
                          : (m.descripcion?.includes('Pedido #') ? `#${m.descripcion.split('#')[1]?.trim()}` : '-')}
                      </td>
                      <td style={{ backgroundColor: 'transparent' }}>
                        <div className="d-flex justify-content-center gap-1">
                          {imagenAdjunta && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-info border-0 p-1"
                              title="Ver Comprobante de Transferencia"
                              onClick={() => onVerComprobante(imagenAdjunta)}
                            >
                              <i className="bi bi-eye fs-5"></i>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info border-0 p-1"
                            title="Ver Ticket de Comprobante"
                            onClick={() => onVerTicket(m)}
                          >
                            <i className="bi bi-receipt fs-5"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
