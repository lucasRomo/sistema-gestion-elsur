import React from 'react';
import type { ItemCompraInsumo } from '../types/compraInsumos';

interface TablaItemsCompraProps {
  items: ItemCompraInsumo[];
  onEliminar: (index: number) => void;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
}

export const TablaItemsCompra: React.FC<TablaItemsCompraProps> = ({
  items,
  onEliminar,
  isDark,
  cardBg,
  cardBorder
}) => {
  return (
    <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
      <h6 className="fw-bold mb-3">Detalle de la Compra ({items.length} items)</h6>
      
      <div 
        className="table-responsive rounded" 
        style={{ 
          height: '170px', 
          overflowY: 'auto',
          border: `1px solid ${cardBorder}`
        }}
      >
        <table 
          className={`table table-sm align-middle m-0 ${isDark ? 'text-white' : ''}`}
          style={{ backgroundColor: 'transparent' }}
        >
          <thead className="sticky-top" style={{ zIndex: 1, backgroundColor: cardBg }}>
            <tr className="text-muted" style={{ backgroundColor: cardBg }}>
              <th style={{ backgroundColor: cardBg, color: 'inherit' }}>#</th>
              <th style={{ backgroundColor: cardBg, color: 'inherit' }}>Categoría</th>
              <th style={{ backgroundColor: cardBg, color: 'inherit' }}>Ítem</th>
              <th style={{ backgroundColor: cardBg, color: 'inherit' }}>Origen</th>
              <th className="text-center" style={{ backgroundColor: cardBg, color: 'inherit' }}>Cant.</th>
              <th className="text-end" style={{ backgroundColor: cardBg, color: 'inherit' }}>P. Unit</th>
              <th className="text-end" style={{ backgroundColor: cardBg, color: 'inherit' }}>Subtotal</th>
              <th className="text-center" style={{ backgroundColor: cardBg, color: 'inherit' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5 opacity-50 border-0" style={{ backgroundColor: 'transparent' }}>
  No hay ítems añadidos a esta compra
</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ backgroundColor: 'transparent' }}>{idx + 1}</td>
                  <td style={{ backgroundColor: 'transparent' }}>
                    <span className={`badge ${item.tipoItem === 'PRODUCTO' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                      {item.tipoItem}
                    </span>
                  </td>
                  <td style={{ backgroundColor: 'transparent' }}>{item.nombreInsumo}</td>
                  <td style={{ backgroundColor: 'transparent' }}>
                    <span className={`badge ${item.esNuevoInsumo ? 'bg-success' : 'bg-secondary'}`}>
                      {item.esNuevoInsumo ? 'Nuevo' : 'Existente'}
                    </span>
                  </td>
                  <td className="text-center" style={{ backgroundColor: 'transparent' }}>{item.cantidadEmpaquetada}</td>
                  <td className="text-end" style={{ backgroundColor: 'transparent' }}>${item.precioUnitario.toFixed(2)}</td>
                  <td className="text-end fw-bold" style={{ backgroundColor: 'transparent' }}>
                    <span className="text-info-custom">${item.subtotal.toFixed(2)}</span>
                  </td>
                  <td className="text-center" style={{ backgroundColor: 'transparent' }}>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-0 px-2"
                      onClick={() => onEliminar(idx)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};