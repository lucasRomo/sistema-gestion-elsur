import React from 'react';
import type { Producto } from '../../types/Producto';

interface Props {
  productos: Producto[];
  onEditar: (p: Producto) => void;
  onConfigurarReceta?: (p: Producto) => void;
  onToggleStockVinculado?: (p: Producto) => void;
}

export const ProductoTabla: React.FC<Props> = ({ 
  productos, 
  onEditar, 
  onConfigurarReceta,
  onToggleStockVinculado 
}) => (
  <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
          <th style={{ padding: '12px' }}>ID</th>
          <th style={{ padding: '12px' }}>Nombre</th>
          <th style={{ padding: '12px' }}>Categoría</th>
          <th style={{ padding: '12px' }}>Precio</th>
          <th style={{ padding: '12px' }}>Stock</th>
          <th style={{ padding: '12px' }}>Máquina</th>
          <th style={{ padding: '12px' }}>Estado</th>
          <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map(p => (
          <tr 
            key={p.idProducto}
            style={{ borderBottom: '1px solid #2d2d30' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <td style={{ padding: '12px' }}>{p.idProducto}</td>
            <td style={{ padding: '12px' }} className="fw-bold">{p.nombreProducto}</td>
            <td style={{ padding: '12px' }}>{p.categoria?.nombre || '-'}</td>
            <td style={{ padding: '12px' }} className="text-info">${Number(p.precioBase).toFixed(2)}</td>
            <td style={{ padding: '12px' }}>
              <span className={p.stock > 0 ? "text-success fw-bold me-2" : "text-danger fw-bold me-2"}>
                {p.stock}
              </span>
              {p.stockVinculado && (
                <span className="badge bg-info text-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                  Auto
                </span>
              )}
            </td>
            <td style={{ padding: '12px' }} className={p.maquinaNecesaria ? "text-warning fw-semibold" : "text-white-50"}>
              {p.maquinaNecesaria?.nombre || 'No aplica'}
            </td>
            <td style={{ padding: '12px' }}>
              <span className={`badge ${p.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                {p.estado}
              </span>
            </td>
            <td style={{ padding: '12px' }}>
              <div className="d-flex justify-content-center gap-2">
                {/* Botón Simple Toggle Vinculo Stock */}
                {onToggleStockVinculado && (
                  <button 
                    className={`btn btn-sm d-flex align-items-center justify-content-center ${
                      p.stockVinculado 
                        ? 'btn-info text-dark fw-bold' 
                        : 'btn-outline-secondary text-secondary'
                    }`} 
                    style={{ 
                      width: '32px', 
                      height: '32px',
                      borderColor: p.stockVinculado ? '#0dcaf0' : '#495057',
                      backgroundColor: p.stockVinculado ? '#0dcaf0' : 'transparent'
                    }}
                    onClick={() => onToggleStockVinculado(p)}
                    title={p.stockVinculado ? "Stock vinculado a insumos (Activado)" : "Vincular stock a insumos (Desactivado)"}
                  >
                    <i className={`bi ${p.stockVinculado ? 'bi-link-45deg' : 'bi-link-45deg'}`} style={{ fontSize: '1.2rem' }}></i>
                  </button>
                )}

                <button 
                  className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" 
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => onEditar(p)}
                  title="Editar Producto"
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                {onConfigurarReceta && (
                  <button 
                    className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center" 
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => onConfigurarReceta(p)}
                    title="Configurar Receta / Insumos"
                  >
                    <i className="bi bi-box-seam"></i>
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);