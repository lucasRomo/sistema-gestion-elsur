import React, { useEffect, useState } from 'react';
import type { Insumo } from '../types/Insumo';
import { useTheme } from '../../../Context/ThemeContext';
import { apiFetch } from '../../../config/api';

interface RelacionesModalProps {
  show: boolean;
  onClose: () => void;
}

export const RelacionesModal: React.FC<RelacionesModalProps> = ({ show, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [insumosConRelacion, setInsumosConRelacion] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(false);

  // Paleta de colores adaptativa
  const bgModal = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const borderColor = isDark ? '#27272a' : '#e2e8f0';
  const accentColor = isDark ? '#0bc9f8' : '#0284c7';

  useEffect(() => {
    if (show) {
      setCargando(true);
      apiFetch('http://localhost:8080/api/insumos')
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
        <div 
          className="modal-content font-monospace shadow-lg" 
          style={{ 
            backgroundColor: bgModal, 
            border: `2px solid ${accentColor}`,
            borderRadius: '16px',
            color: textColor 
          }}
        >
          
          {/* Header */}
          <div className="modal-header border-bottom pb-3" style={{ borderColor }}>
            <h5 className="modal-title fw-bold d-flex align-items-center" style={{ color: accentColor }}>
              <i className="bi bi-diagram-3-fill me-2"></i> Tabla de Equivalencias y Relaciones
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <p className="small mb-3" style={{ color: subTextColor }}>
              Consulta rápida del factor de conversión configurado entre la <strong>Unidad de Empaque (Compra)</strong> y la <strong>Unidad Suelta (Consumo)</strong> por insumo.
            </p>

            {cargando ? (
              <div className="text-center py-4" style={{ color: accentColor }}>Cargando relaciones...</div>
            ) : insumosConRelacion.length === 0 ? (
              <div 
                className="text-center py-4 rounded border" 
                style={{ backgroundColor: isDark ? '#27272a' : '#f8fafc', borderColor, color: subTextColor }}
              >
                No hay insumos configurados con factor de conversión actualmente.
              </div>
            ) : (
              <div 
                className="table-responsive rounded border" 
                style={{ maxHeight: '350px', overflowY: 'auto', borderColor }}
              >
                <table 
  className="table align-middle mb-0"
  style={{ 
    color: textColor,
    backgroundColor: 'transparent',
    '--bs-table-bg': 'transparent',
    '--bs-table-color': textColor,
    borderColor: isDark ? '#27272a' : '#e2e8f0'
  } as React.CSSProperties}
>
  <thead>
    <tr 
      className="text-uppercase" 
      style={{ 
        backgroundColor: isDark ? '#1b1b1b' : '#f1f5f9',
        color: accentColor,
        borderBottom: `2px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
      }}
    >
      <th className="py-3" style={{ color: accentColor }}>Insumo</th>
      <th className="py-3" style={{ color: accentColor }}>Unidad Empaque</th>
      <th className="py-3 text-center" style={{ color: accentColor }}>Factor Conversión</th>
      <th className="py-3" style={{ color: accentColor }}>Unidad Suelta</th>
      <th className="py-3" style={{ color: accentColor }}>Equivalencia Completa</th>
    </tr>
  </thead>
  <tbody>
    {insumosConRelacion.map((item) => (
      <tr 
        key={item.idInsumo}
        style={{ 
          borderColor: isDark ? '#27272a' : '#e2e8f0',
          backgroundColor: 'transparent'
        }}
      >
        <td className="fw-bold" style={{ color: textColor }}>{item.nombreInsumo}</td>
        <td>
          <span 
            className="px-2 py-1 rounded small fw-semibold"
            style={{
              fontSize: '0.75rem',
              backgroundColor: isDark ? '#27272a' : '#e2e8f0',
              color: isDark ? '#f4f4f5' : '#0f172a',
              border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
            }}
          >
            {item.unidadCompra?.nombre}
          </span>
        </td>
        <td className="text-center fw-bold" style={{ color: isDark ? '#fde047' : '#d97706' }}>
          {item.factorConversion}
        </td>
        <td>
          <span 
            className="px-2 py-1 rounded small fw-semibold"
            style={{
              fontSize: '0.75rem',
              backgroundColor: isDark ? 'rgba(11, 201, 248, 0.15)' : '#e0f2fe',
              color: isDark ? '#0bc9f8' : '#0369a1',
              border: `1px solid ${isDark ? '#0891b2' : '#7dd3fc'}`
            }}
          >
            {item.unidadMedida?.nombre}
          </span>
        </td>
        <td className="small" style={{ color: subTextColor }}>
          1 {item.unidadCompra?.nombre} = {item.factorConversion} {item.unidadMedida?.nombre}
        </td>
      </tr>
    ))}
  </tbody>
</table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top py-2" style={{ borderColor }}>
            <button type="button" className="btn btn-sm btn-secondary px-4 fw-bold" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};