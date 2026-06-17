import React from 'react';
import type { Insumo } from '../../types/Insumo';

interface InsumoTablaProps {
  insumos: Insumo[];
  onEditar: (insumo: Insumo) => void;
  onVerProveedores: (insumo: Insumo) => void;
}

export const InsumoTabla: React.FC<InsumoTablaProps> = ({ insumos, onEditar, onVerProveedores }) => {
  return (
    <div className="table-responsive rounded-3 border border-secondary mb-4" style={{ maxHeight: '65vh', overflowY: 'auto', backgroundColor: '#18181b' }}>
      <table className="table table-dark table-hover m-0 align-middle text-center font-monospace" style={{ fontSize: '0.85rem' }}>
        <thead className="table-active sticky-top bg-dark text-secondary" style={{ zIndex: 1 }}>
          <tr>
            <th>ID</th>
            <th>Nombre Insumo</th>
            <th>Stock Mínimo</th>
            <th>Stock Actual</th>
            <th>Tipo de Proveedor</th>
            <th>Estado</th>
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-muted py-4">No se encontraron insumos.</td>
            </tr>
          ) : (
            insumos.map((i) => (
              <tr key={i.idInsumo}>
                <td>{i.idInsumo}</td>
                <td className="fw-bold">{i.nombreInsumo}</td>
                <td className="text-warning">{i.stockMinimo}</td>
                <td className={`fw-bold ${i.stockActual <= i.stockMinimo ? 'text-danger' : 'text-success'}`}>
                  {i.stockActual} {i.stockActual <= i.stockMinimo && <i className="bi bi-exclamation-circle-fill ms-1"></i>}
                </td>
                <td>{i.proveedor?.tipoProveedor?.descripcion || '-'}</td>
                <td>
                  <span className={`badge px-2 py-1 fw-semibold ${i.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                    {i.estado}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn btn-sm p-0 text-info fs-5" 
                      onClick={() => onEditar(i)} 
                      title="Editar Insumo"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button 
                      className="btn btn-sm p-0 fs-5" 
                      style={{ color: '#a855f7' }} 
                      onClick={() => onVerProveedores(i)} 
                      title="Ver Proveedores del rubro"
                    >
                      <i className="bi bi-truck"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};