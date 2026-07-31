import React from 'react';
import type { Insumo } from '../../types/Insumo';

interface InsumoTablaProps {
  insumos: Insumo[];
  onEditar: (insumo: Insumo) => void;
  onVerProveedores: (insumo: Insumo) => void;
}

export const InsumoTabla: React.FC<InsumoTablaProps> = ({ insumos, onEditar, onVerProveedores }) => {
  return (
    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Nombre Insumo</th>
            <th style={{ padding: '12px' }}>Stock Mínimo</th>
            <th style={{ padding: '12px' }}>Stock Actual</th>
            <th style={{ padding: '12px' }}>Tipo de Proveedor</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4">No se han registrado o encontrado insumos en el sistema.</td>
            </tr>
          ) : (
            insumos.map((i) => (
              <tr 
                key={i.idInsumo}
                style={{ borderBottom: '1px solid #2d2d30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px' }}>{i.idInsumo}</td>
                <td style={{ padding: '12px' }} className="fw-bold">{i.nombreInsumo}</td>
                <td style={{ padding: '12px' }} className="text-warning">{i.stockMinimo}</td>
                <td style={{ padding: '12px' }} className={`fw-bold ${i.stockActual <= i.stockMinimo ? 'text-danger' : 'text-success'}`}>
                  {i.stockActual} {i.stockActual <= i.stockMinimo && <i className="bi bi-exclamation-circle-fill ms-1"></i>}
                </td>
                <td style={{ padding: '12px' }}>{i.proveedor?.tipoProveedor?.descripcion || '-'}</td>
                <td style={{ padding: '12px' }}>
                  <span className={`badge ${i.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
              {i.estado}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div className="d-flex justify-content-center gap-2">
                    {/* Botones con el estilo que ya definimos globalmente */}
                    <button 
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" 
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onEditar(i)} 
                      title="Editar Insumo"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button 
                     className="btn btn-sm d-flex align-items-center justify-content-center btn-truck-custom" 
                     style={{ width: '32px', height: '32px' }} 
                     onClick={() => onVerProveedores(i)} 
                     title="Ver Proveedores del rubro">
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