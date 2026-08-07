import React, { useEffect, useState } from 'react';
import type { Insumo } from '../../types/Insumo';

interface RelacionesModalProps {
  show: boolean;
  onClose: () => void;
}

export const RelacionesModal: React.FC<RelacionesModalProps> = ({ show, onClose }) => {
  const [insumosConRelacion, setInsumosConRelacion] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (show) {
      setCargando(true);
      fetch('http://localhost:8080/api/insumos')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const filtrados = data.filter((i: Insumo) => 
              i.unidadCompra && i.unidadMedida && i.factorConversion && i.factorConversion > 0
            );
            setInsumosConRelacion(filtrados);
          }
        })
        .catch(err => console.error('Error al cargar relaciones:', err))
        .finally(() => setCargando(false));
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #0bc9f8' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold" style={{ color: '#0bc9f8' }}>
              <i className="bi bi-diagram-3-fill me-2"></i> Tabla de Equivalencias y Relaciones
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <p className="text-white-50 small mb-3">
              Consulta rápida del factor de conversión configurado entre la <strong>Unidad de Empaque (Compra)</strong> y la <strong>Unidad Suelta (Consumo)</strong> por insumo.
            </p>

            {cargando ? (
              <div className="text-center text-info py-4">Cargando relaciones...</div>
            ) : insumosConRelacion.length === 0 ? (
              <div className="text-center text-white-50 py-4 border border-secondary rounded" style={{ backgroundColor: '#27272a' }}>
                No hay insumos configurados con factor de conversión actualmente.
              </div>
            ) : (
              <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table table-dark table-striped align-middle mb-0">
                  <thead className="table-dark text-info">
                    <tr>
                      <th>Insumo</th>
                      <th>Unidad Empaque</th>
                      <th className="text-center">Factor Conversión</th>
                      <th>Unidad Suelta</th>
                      <th>Equivalencia Completa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosConRelacion.map((item) => (
                      <tr key={item.idInsumo}>
                        <td className="fw-bold">{item.nombreInsumo}</td>
                        <td><span className="badge bg-secondary">{item.unidadCompra?.nombre}</span></td>
                        <td className="text-center fw-bold text-warning">{item.factorConversion}</td>
                        <td><span className="badge bg-info text-dark">{item.unidadMedida?.nombre}</span></td>
                        <td className="small text-white-50">
                          1 {item.unidadCompra?.nombre} = {item.factorConversion} {item.unidadMedida?.nombre}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer border-top border-secondary py-2">
            <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};