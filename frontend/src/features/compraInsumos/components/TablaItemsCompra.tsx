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
      <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        <table className={`table table-sm table-hover align-middle m-0 ${isDark ? 'table-dark' : ''}`}>
          <thead>
            <tr className="text-muted">
              <th>#</th>
              <th>Categoría</th>
              <th>Ítem</th>
              <th>Origen</th>
              <th className="text-center">Cant.</th>
              <th className="text-end">P. Unit</th>
              <th className="text-end">Subtotal</th>
              <th className="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-3 opacity-50">
                  No hay ítems añadidos a esta compra
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className={`badge ${item.tipoItem === 'PRODUCTO' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                      {item.tipoItem}
                    </span>
                  </td>
                  <td>{item.nombreInsumo}</td>
                  <td>
                    <span className={`badge ${item.esNuevoInsumo ? 'bg-success' : 'bg-secondary'}`}>
                      {item.esNuevoInsumo ? 'Nuevo' : 'Existente'}
                    </span>
                  </td>
                  <td className="text-center">{item.cantidadEmpaquetada}</td>
                  <td className="text-end">${item.precioUnitario.toFixed(2)}</td>
                  <td className="text-end fw-bold">${item.subtotal.toFixed(2)}</td>
                  <td className="text-center">
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