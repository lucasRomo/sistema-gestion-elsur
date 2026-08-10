import React, { useState, useEffect } from 'react';
import type { Insumo } from '../types/Insumo';
import type { Proveedor } from '../../proveedores/types/Proveedor';
import { useTheme } from '../../../Context/ThemeContext';

interface InsumoProveedoresModalProps {
  show: boolean;
  insumo: Insumo | null;
  onClose: () => void;
}

export const InsumoProveedoresModal: React.FC<InsumoProveedoresModalProps> = ({ show, insumo, onClose }) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // ◄ NUEVO: Estado del filtro
  const [cargando, setCargando] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  useEffect(() => {
    if (show && insumo?.proveedor?.tipoProveedor) {
      setCargando(true);
      fetch('http://localhost:8080/api/proveedores')
        .then(res => res.json())
        .then((data: Proveedor[]) => {
          // Filtramos primero por categoría
          const compat = data.filter(
            p => p.tipoProveedor?.idTipoProveedor === insumo.proveedor?.tipoProveedor?.idTipoProveedor
          );
          setProveedores(compat);
          setCargando(false);
        })
        .catch(err => {
          console.error("Error cargando proveedores:", err);
          setCargando(false);
        });
    }
  }, [show, insumo]);

  // ◄ NUEVO: Lógica de filtrado local
  const proveedoresFiltrados = proveedores.filter(p => 
    filtroEstado === 'Todos' ? true : p.estado === filtroEstado
  );

  if (!show || !insumo) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #a855f7' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold" style={{ color: '#a855f7' }}>
              <i className="bi bi-truck me-2"></i> Proveedores de "{insumo.nombreInsumo}"
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="small d-block" style={{ color: mutedText }}>Categoría:</span>
                <span className="badge bg-dark border border-secondary text-info">{insumo.proveedor?.tipoProveedor?.descripcion || 'Sin categoría'}</span>
              </div>
              
              {/* ◄ NUEVO: Selector de filtro */}
              <div className="d-flex align-items-center gap-2">
                <span className="small" style={{ color: mutedText }}>Filtrar Estado:</span>
                <select 
                  className="form-select form-select-sm bg-dark border-secondary text-white"
                  style={{ width: '130px' }}
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Desactivado">Desactivado</option>
                </select>
              </div>
            </div>

            <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className={`table table-hover m-0 align-middle text-center ${isDark ? 'table-dark' : ''}`} style={{ fontSize: '0.85rem' }}>
                <thead className="table-active sticky-top bg-dark text-secondary" style={{ zIndex: 1 }}>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Comercial</th>
                    <th>Contacto</th>
                    <th>Email</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan={5} className="text-center py-3" style={{ color: mutedText }}>Buscando...</td></tr>
                  ) : proveedoresFiltrados.length > 0 ? (
                    proveedoresFiltrados.map(p => (
                      <tr key={p.idProveedor}>
                        <td>{p.idProveedor}</td>
                        <td className="fw-bold">{p.nombreComercial}</td>
                        <td>{p.contactoNombre || '-'}</td>
                        <td className="text-info">{p.emailContacto || '-'}</td>
                        <td>
                          <span className={`badge px-2 py-1 fw-semibold ${p.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">No se encontraron resultados para este estado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-top border-secondary py-2">
            <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};