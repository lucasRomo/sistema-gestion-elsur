import React from 'react';
import type { CartItem } from '../../pedidos/general/types/Pedido';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  carrito: CartItem[];
  onEliminar: (index: number) => void;
}

export const CarritoLista: React.FC<Props> = ({ carrito, onEliminar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="mb-2">
      {/* 🚀 Cabecera alineada: agregamos pe-3 para compensar la barra de scroll */}
      <div className={`d-flex border-bottom pb-2 mb-2 small fw-bold pe-3 ${isDark ? 'text-light border-secondary' : 'text-dark border-light-subtle'}`}>
        <div style={{ width: '40%' }}>Lista de Productos:</div>
        <div style={{ width: '20%' }}>Cantidad:</div>
        <div style={{ width: '20%' }}>Precio Unitario:</div>
        <div style={{ width: '20%' }}>SubTotal:</div>
      </div>
      
      {/* Contenedor con altura ajustada a 140px */}
      <div style={{ maxHeight: '140px', overflowY: 'auto', overflowX: 'hidden' }} className="pe-1">
        {carrito.length === 0 ? (
          <div className="text-center text-light py-3">No hay productos en la lista.</div>
        ) : (
          carrito.map((item, index) => (
            <div key={index} className={`d-flex align-items-center mb-2 border-bottom pb-1 flex-shrink-0 ${isDark ? 'text-white border-dark' : 'text-dark border-light-subtle'}`}>
              {/* Columna Nombre */}
              <div style={{ width: '40%' }} className="d-flex align-items-center">
                <button 
                  className="btn btn-sm btn-link text-danger p-0 me-2" 
                  onClick={() => onEliminar(index)}
                  title="Eliminar"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
                <span className={isDark ? 'text-light text-truncate' : 'text-dark text-truncate'}>{item.producto.nombreProducto}</span>
              </div>
              
              {/* Columnas Datos */}
              <div style={{ width: '20%' }} className={isDark ? 'text-light' : 'text-dark'}>{item.cantidad}</div>
              <div style={{ width: '20%' }} className={isDark ? 'text-light' : 'text-dark'}>${item.producto.precioBase}</div>
              <div style={{ width: '20%' }} className={`fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>${item.subtotal}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};