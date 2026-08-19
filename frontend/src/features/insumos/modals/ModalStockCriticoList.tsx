import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

export interface ItemStockCritico {
  id: number | string;
  nombre: string;
  stockActual: number;
  stockMinimoOTolerancia: number;
  unidadMedida?: any;
  estado?: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  titulo?: string;
  items: ItemStockCritico[];
}

export const ModalStockCriticoList: React.FC<Props> = ({
  show,
  onClose,
  titulo = 'Stock Crítico de Insumos',
  items
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!show) return null;

  // Filtrar ítems en estado crítico O a 5 unidades o menos de llegar al límite
  const itemsCriticos = items.filter(
    (item) => item.stockActual <= item.stockMinimoOTolerancia + 5
  );

  const bgModal = isDark ? '#1a1a1c' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const tableHeaderBg = isDark ? '#1a1a1c' : '#f1f5f9';
  const rowBorder = isDark ? '#2d323e' : '#e2e8f0';

  const obtenerTextoUnidad = (unidad: any): string => {
    if (!unidad) return '';
    if (typeof unidad === 'object') return unidad.nombre || unidad.sigla || unidad.nombreUnidad || '';
    return String(unidad);
  };

  return (
    <div className="modal show d-block font-monospace" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div 
          className="modal-content shadow-lg p-2" 
          style={{ 
            backgroundColor: bgModal, 
            border: '2px solid #eab308', 
            borderRadius: '16px',
            color: textColor 
          }}
        >
          {/* HEADER */}
          <div className="modal-header border-0 pb-2 pt-3 px-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-5 text-warning">
              <i className="bi bi-exclamation-triangle-fill fs-4"></i> {titulo}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
              style={{ opacity: 0.8 }}
            ></button>
          </div>

          {/* BODY */}
          <div className="modal-body px-3 py-2">
            <p className="small mb-3" style={{ color: subTextColor }}>
              A continuación se detallan los ítems en stock crítico o que se encuentran a 5 o menos unidades de alcanzar el límite permitido.
            </p>

            {itemsCriticos.length === 0 ? (
              <div className="alert alert-success text-center my-3 fw-bold" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> ¡Excelente! Todos los niveles de stock están óptimos.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table 
                  className="table align-middle text-center mb-0" 
                  style={{ 
                    '--bs-table-bg': 'transparent', 
                    '--bs-table-color': textColor,
                    color: textColor 
                  } as React.CSSProperties}
                >
                  <thead>
                    <tr style={{ backgroundColor: tableHeaderBg }}>
                      <th className="py-2 text-start ps-3" style={{ color: textColor }}>Nombre / Ítem</th>
                      <th className="py-2" style={{ color: textColor }}>Stock Actual</th>
                      <th className="py-2" style={{ color: textColor }}>Límite / Tolerancia</th>
                      <th className="py-2" style={{ color: textColor }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsCriticos.map((item) => {
                      const esAgotado = item.stockActual <= 0;
                      const esCritico = item.stockActual <= item.stockMinimoOTolerancia;
                      // Si no está crítico pero está dentro de las 5 unidades
                      const esProximo = !esCritico && item.stockActual <= item.stockMinimoOTolerancia + 5;

                      let badgeText = 'SIN STOCK';
                      let badgeClass = 'bg-danger text-white';
                      let stockColor = '#ef4444';

                      if (!esAgotado && esCritico) {
                        badgeText = 'CRÍTICO';
                        badgeClass = 'bg-warning text-dark';
                        stockColor = '#f59e0b';

                      } else if (esProximo) {
                        badgeText = 'PRÓXIMO';
                        badgeClass = 'bg-info text-dark';
                        stockColor = '#0bc9f8';
                        
                      }

                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${rowBorder}` }}>
                          <td className="fw-bold text-start ps-3" style={{ color: textColor }}>{item.nombre}</td>
                          <td className="fw-bold fs-6" style={{ color: stockColor }}>
                            {item.stockActual} {obtenerTextoUnidad(item.unidadMedida)}
                          </td>
                          <td style={{ color: subTextColor }}>
                            {item.stockMinimoOTolerancia} {obtenerTextoUnidad(item.unidadMedida)}
                          </td>
                          <td>
                            <span className={`badge fw-bold px-2 py-1 ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 px-3 pb-3 pt-2 d-flex justify-content-end">
            <button 
              type="button" 
              className="btn btn-secondary px-4 fw-bold" 
              onClick={onClose}
              style={{ borderRadius: '8px' }}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};