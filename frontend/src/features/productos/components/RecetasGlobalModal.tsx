import React, { useState } from 'react';
import type { Producto } from '../types/Producto';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  productos: Producto[];
  onClose: () => void;
  onEditarReceta: (p: Producto) => void;
}

export const RecetasGlobalModal: React.FC<Props> = ({ show, productos, onClose, onEditarReceta }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#6f42c1' : '#a78bfa';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const inputBg = isDark ? '#1a1a1c' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const thBg = isDark ? '#1a1a1c' : '#f8fafc';
  const thText = isDark ? '#a1a1aa' : '#475569';
  const rowBorder = isDark ? '#27272a' : '#e2e8f0';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [busqueda, setBusqueda] = useState('');

  if (!show) return null;

  const productosFiltrados = productos.filter(p => 
    p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div 
          className="modal-content shadow-lg" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `1.5px solid ${modalBorder}`, 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header border-bottom" style={{ borderColor: headerBorder }}>
            <h5 className="modal-title fw-bold" style={{ color: '#a78bfa' }}>
              <i className="bi bi-journal-text me-2"></i>Gestión de Productos y sus Recetas
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <input 
                type="text" 
                className="form-control shadow-none" 
                style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                placeholder="Buscar producto por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="table-responsive" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <table className="w-100 align-middle mb-0" style={{ color: textColor, borderCollapse: 'collapse' }}>
                <thead className="sticky-top" style={{ backgroundColor: thBg, zIndex: 1 }}>
                  <tr className="border-bottom" style={{ borderColor: rowBorder, color: thText, fontSize: '0.85rem' }}>
                    <th className="py-3 px-3 fw-bold" style={{ backgroundColor: thBg }}>ID</th>
                    <th className="py-3 px-3 fw-bold" style={{ backgroundColor: thBg }}>Producto</th>
                    <th className="py-3 px-3 fw-bold" style={{ backgroundColor: thBg }}>Categoría</th>
                    <th className="py-3 px-3 fw-bold" style={{ backgroundColor: thBg }}>Estado</th>
                    <th className="py-3 px-3 fw-bold text-center" style={{ backgroundColor: thBg }}>Configurar Receta</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4" style={{ color: mutedText }}>
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => (
                      <tr key={p.idProducto} className="border-bottom" style={{ borderColor: rowBorder }}>
                        <td className="py-3 px-3" style={{ color: mutedText }}>{p.idProducto}</td>
                        <td className="py-3 px-3 fw-bold" style={{ color: textColor }}>{p.nombreProducto}</td>
                        <td className="py-3 px-3" style={{ color: mutedText }}>{p.categoria?.nombre || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`badge ${p.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            className="btn btn-sm px-3 fw-semibold"
                            style={{ backgroundColor: '#6f42c1', borderColor: '#59339d', color: '#ffffff' }}
                            onClick={() => onEditarReceta(p)}
                          >
                            <i className="bi bi-gear-fill me-1"></i> Ver / Editar Receta
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-top" style={{ borderColor: headerBorder }}>
  <button className="btn btn-secondary px-4" onClick={onClose}>Cerrar</button>
</div>

        </div>
      </div>
    </div>
  );
};