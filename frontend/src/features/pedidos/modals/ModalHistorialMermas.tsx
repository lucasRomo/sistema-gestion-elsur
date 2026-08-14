import React, { useEffect, useState } from 'react';
import { mermaService, type MermaEntity } from '../service/mermaService';
import { useTheme } from '../../../Context/ThemeContext';

interface ModalHistorialMermasProps {
  pedido: any;
  onClose: () => void;
}

export const ModalHistorialMermas: React.FC<ModalHistorialMermasProps> = ({ pedido, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
          className="modal-content text-white font-monospace p-4 shadow-lg" 
          style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px' }}
        >
          {/* Cabecera */}
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
            <h5 className="fw-bold mb-0 text-warning">
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
              <table className="table table-dark table-hover align-middle m-0 small">
                <thead className="table-secondary text-uppercase font-monospace" style={{ fontSize: '0.75rem' }}>
                  <tr>
                    <th>Fecha</th>
                    <th className="text-center">Tipo</th>
                    <th>Item / Insumo</th>
                    <th className="text-center">Cantidad</th>
                    <th>Motivo / Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {mermas.map((m) => {
                    const esProducto = Boolean(m.producto);
                    const esInsumo = Boolean(m.insumo);

                    return (
                      <tr key={m.idMerma || Math.random()}>
                        <td className="text-nowrap">{formatearFecha(m.fechaMerma)}</td>
                        
                        {/* COLUMNA TIPO */}
                        <td className="text-center">
                          {esProducto ? (
                            <span className="badge bg-primary text-white">PRODUCTO</span>
                          ) : esInsumo ? (
                            <span className="badge bg-info text-dark">INSUMO</span>
                          ) : (
                            <span className="badge bg-secondary">GENERAL</span>
                          )}
                        </td>

                        <td>
                          {m.producto?.nombreProducto || m.insumo?.nombreInsumo || 'Material/General'}
                        </td>
                        <td className="text-center fw-bold text-warning">{m.cantidad}</td>
                        <td style={{ maxWidth: '250px', wordBreak: 'break-word' }}>{m.descripcion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-end mt-3 pt-2 border-top border-secondary">
            <button className="btn btn-outline-secondary fw-bold px-4" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};