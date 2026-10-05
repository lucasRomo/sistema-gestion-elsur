import React from 'react';
import type { CartItem } from '../../pedidos/general/types/Pedido';
import { useTheme } from '../../../Context/ThemeContext';
import { formatearMonto } from '../../../utils/formato';

interface Props {
  carrito: CartItem[];
  onEliminar: (index: number) => void;
  onCambiarCantidad?: (index: number, delta: number) => void;
}

export const CarritoLista: React.FC<Props> = ({ carrito, onEliminar, onCambiarCantidad }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const texto = isDark ? 'text-light' : 'text-dark';
  const bordeBoton = isDark ? '#3f3f46' : '#cbd5e1';

  const botonCantidad: React.CSSProperties = {
    width: '22px', height: '22px', padding: 0, lineHeight: 1, fontSize: '0.8rem',
    border: `1px solid ${bordeBoton}`, borderRadius: '6px', background: 'transparent',
    color: isDark ? '#ffffff' : '#0f172a'
  };

  return (
    <div className="mb-2">
      <div className={`d-flex border-bottom pb-2 mb-2 small fw-bold pe-3 ${isDark ? 'text-light border-secondary' : 'text-dark border-light-subtle'}`}>
        <div style={{ width: '40%' }}>Lista de Productos:</div>
        <div style={{ width: '20%' }}>Cantidad:</div>
        <div style={{ width: '20%' }}>Precio Unitario:</div>
        <div style={{ width: '20%' }}>SubTotal:</div>
      </div>

      <div style={{ maxHeight: '220px', overflowY: 'auto', overflowX: 'hidden' }} className="pe-1">
        {carrito.length === 0 ? (
          <div className="text-center py-3" style={{ color: isDark ? '#a1a1aa' : '#64748b' }}>No hay productos en la lista.</div>
        ) : (
          carrito.map((item, index) => (
            <div key={item.producto.idProducto ?? index} className={`d-flex align-items-center mb-2 border-bottom pb-1 flex-shrink-0 ${isDark ? 'text-white border-dark' : 'text-dark border-light-subtle'}`}>
              <div style={{ width: '40%' }} className="d-flex align-items-center">
                <button
                  className="btn btn-sm btn-link text-danger p-0 me-2"
                  onClick={() => onEliminar(index)}
                  title="Eliminar"
                  aria-label={`Eliminar ${item.producto.nombreProducto}`}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
                <span className={`${texto} text-truncate`}>{item.producto.nombreProducto}</span>
              </div>
              <div style={{ width: '20%' }} className={`d-flex align-items-center gap-2 ${texto}`}>
                {onCambiarCantidad && (
                  <button
                    type="button"
                    style={botonCantidad}
                    onClick={() => onCambiarCantidad(index, -1)}
                    disabled={item.cantidad <= 1}
                    title="Restar uno"
                    aria-label="Restar uno"
                  >−</button>
                )}
                <span className="fw-semibold">{item.cantidad}</span>
                {onCambiarCantidad && (
                  <button
                    type="button"
                    style={botonCantidad}
                    onClick={() => onCambiarCantidad(index, 1)}
                    title="Sumar uno"
                    aria-label="Sumar uno"
                  >+</button>
                )}
              </div>
              <div style={{ width: '20%' }} className={texto}>${formatearMonto(item.producto.precioBase)}</div>
              <div style={{ width: '20%' }} className={`fw-bold ${texto}`}>${formatearMonto(item.subtotal)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
