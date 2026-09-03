import React, { useEffect, useState } from 'react';
import { mermaService, type MermaEntity } from '../../../../services/mermaService';
import { useTheme } from '../../../../Context/ThemeContext';

interface ModalHistorialMermasProps {
  pedido: any;
  onClose: () => void;
}

export const ModalHistorialMermas: React.FC<ModalHistorialMermasProps> = ({ pedido, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Paleta de colores adaptativa
  const bgModal = isDark ? '#1b1b1b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const borderColor = isDark ? '#3f3f46' : '#e2e8f0';
  const tableHeaderBg = isDark ? '#18181b' : '#ffffff';

  const [mermas, setMermas] = useState<MermaEntity[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const idPedido = pedido?.id_pedido || pedido?.idPedido;

  useEffect(() => {
    if (idPedido) {
      setCargando(true);
      mermaService.obtenerPorPedido(idPedido)
        .then((data) => setMermas(data))
        .catch((err) => console.error("Error al obtener mermas:", err))
        .finally(() => setCargando(false));
    }
  }, [idPedido]);

  const formatearFecha = (fechaIso?: string) => {
    if (!fechaIso) return '-';
    const date = new Date(fechaIso);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div 
  className="modal-content font-monospace p-4 shadow-lg" 
  style={{ 
    backgroundColor: bgModal, 
    border: '2px solid #e9c31d',
    borderRadius: '16px',
    color: textColor
  }}
>
          {/* Cabecera */}
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor }}>
            <h5 className="fw-bold mb-0 text-warning d-flex align-items-center">
              <i className="bi bi-exclamation-diamond-fill me-2"></i>
              Historial de Mermas - Pedido #{idPedido}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`}
              onClick={onClose}
            ></button>
          </div>

          {/* Contenido */}
          <div className="table-responsive my-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {cargando ? (
              <div className="text-center py-4 text-muted">Cargando mermas...</div>
            ) : mermas.length === 0 ? (
              <div className="text-center py-4 text-muted">No hay mermas registradas para este pedido.</div>
            ) : (
              <table 
                className="table align-middle m-0 small"
                style={{ 
                  color: textColor,
                  backgroundColor: 'transparent',
                  '--bs-table-bg': 'transparent',
                  '--bs-table-color': textColor,
                  borderColor: borderColor
                } as React.CSSProperties}
              >
                <thead>
                  <tr 
                    className="text-uppercase font-monospace" 
                    style={{ 
                      fontSize: '0.75rem',
                      backgroundColor: tableHeaderBg,
                      color: isDark ? '#eab308' : '#854d0e',
                      borderBottom: `2px solid ${borderColor}`
                    }}
                  >
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Origen / Ítem</th>
                    <th className="py-2 text-center">Cantidad</th>
                    <th className="py-2">Motivo / Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {mermas.map((m) => {
                    const esInsumo = Boolean(m.insumo);

                    return (
                      <tr key={m.idMerma || Math.random()} style={{ borderColor }}>
                        <td className="text-nowrap" style={{ color: textColor }}>
                          {formatearFecha(m.fechaMerma)}
                        </td>
                        
                        <td className="py-2">
                          <div className="d-flex flex-column gap-1">
                            {esInsumo ? (
                              <>
                                <div className="d-flex align-items-center gap-2">
                                  <span 
                                    className="px-2 py-0.5 rounded small fw-semibold"
                                    style={{
                                      fontSize: '0.7rem',
                                      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef3c7',
                                      color: isDark ? '#fde047' : '#b45309',
                                      border: `1px solid ${isDark ? '#ca8a04' : '#fcd34d'}`
                                    }}
                                  >
                                    INSUMO
                                  </span>
                                  <span className="fw-bold" style={{ color: textColor }}>
                                    {m.insumo?.nombreInsumo}
                                  </span>
                                </div>
                                {m.producto?.nombreProducto && (
                                  <div className="small ms-1 d-flex align-items-center gap-1" style={{ color: subTextColor, fontSize: '0.8rem' }}>
                                    <i className="bi bi-arrow-return-right text-warning"></i>
                                    <span>Pertenece al producto:</span>
                                    <span className="fw-semibold" style={{ color: isDark ? '#fde047' : '#d97706' }}>
                                      {m.producto.nombreProducto}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                <span 
                                  className="px-2 py-0.5 rounded small fw-semibold"
                                  style={{
                                    fontSize: '0.7rem',
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                                    color: isDark ? '#60a5fa' : '#1d4ed8',
                                    border: `1px solid ${isDark ? '#2563eb' : '#93c5fd'}`
                                  }}
                                >
                                  PRODUCTO
                                </span>
                                <span className="fw-bold" style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                                  {m.producto?.nombreProducto || 'Material/General'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="text-center fw-bold text-danger fs-6">-{m.cantidad}</td>
                        <td style={{ maxWidth: '250px', wordBreak: 'break-word', color: subTextColor }}>
                          {m.descripcion}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-end mt-3 pt-2 border-top" style={{ borderColor }}>
            <button className="btn btn-secondary fw-bold px-4" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};