import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';

interface Props {
  show: boolean;
  productos: Producto[];
  onClose: () => void;
  onEditarReceta: (p: Producto) => void;
}

export const RecetasGlobalModal: React.FC<Props> = ({ show, productos, onClose, onEditarReceta }) => {
  const [busqueda, setBusqueda] = useState('');

  if (!show) return null;

  const productosFiltrados = productos.filter(p => 
    p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content text-white" style={{ backgroundColor: '#1a1a1c', border: '1px solid #6f42c1', borderRadius: '12px' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold" style={{ color: '#a78bfa' }}>
              <i className="bi bi-journal-text me-2"></i>Gestión de Productos y sus Recetas
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <input 
                type="text" 
                className="form-control bg-dark text-white border-secondary" 
                placeholder="Buscar producto por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="table-responsive" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <table className="table table-dark table-striped table-hover align-middle">
                <thead>
                  <tr className="border-bottom border-secondary text-secondary">
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th className="text-center">Configurar Receta</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => (
                      <tr key={p.idProducto}>
                        <td>{p.idProducto}</td>
                        <td className="fw-bold text-white">{p.nombreProducto}</td>
                        <td>{p.categoria?.nombre || '-'}</td>
                        <td>
                          <span className={`badge ${p.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm px-3 text-white fw-semibold"
                            style={{ backgroundColor: '#6f42c1', borderColor: '#59339d' }}
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

          <div className="modal-footer border-top border-secondary">
            <button className="btn btn-secondary px-4" onClick={onClose}>Cerrar</button>
          </div>

        </div>
      </div>
    </div>
  );
};