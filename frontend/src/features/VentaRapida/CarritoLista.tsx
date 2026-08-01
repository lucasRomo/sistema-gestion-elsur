import React from 'react';
import type { CartItem } from '../../types/Pedido';

interface Props {
  carrito: CartItem[];
  onEliminar: (index: number) => void;
}

export const CarritoLista: React.FC<Props> = ({ carrito, onEliminar }) => {
  return (
    <div className="mb-2">
      {/* 🚀 Cabecera alineada: agregamos pe-3 para compensar la barra de scroll */}
      <div className="d-flex text-light border-bottom border-secondary pb-2 mb-2 small fw-bold pe-3">
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
            <div key={index} className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1 flex-shrink-0">
              {/* Columna Nombre */}
              <div style={{ width: '40%' }} className="d-flex align-items-center">
                <button 
                  className="btn btn-sm btn-link text-danger p-0 me-2" 
                  onClick={() => onEliminar(index)}
                  title="Eliminar"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
                <span className="text-light text-truncate">{item.producto.nombreProducto}</span>
              </div>
              
              {/* Columnas Datos */}
              <div style={{ width: '20%' }} className="text-light">{item.cantidad}</div>
              <div style={{ width: '20%' }} className="text-light">${item.producto.precioBase}</div>
              <div style={{ width: '20%' }} className="text-light fw-bold">${item.subtotal}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};