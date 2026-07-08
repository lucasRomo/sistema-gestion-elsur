import React from 'react';
import type { CartItem } from '../../types/Pedido';

interface Props {
  carrito: CartItem[];
  onEliminar: (index: number) => void;
}

export const CarritoLista: React.FC<Props> = ({ carrito, onEliminar }) => {
  return (
    <div className="mb-4">
      {/* Cabecera de la tabla con texto claro */}
      <div className="d-flex text-light border-bottom border-secondary pb-2 mb-2 small fw-bold">
        <div style={{ width: '40%' }}>Lista de Productos:</div>
        <div style={{ width: '20%' }}>Cantidad:</div>
        <div style={{ width: '20%' }}>Precio Unitario:</div>
        <div style={{ width: '20%' }}>SubTotal:</div>
      </div>
      
      {/* Contenedor de filas con scroll */}
      <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}>
        {carrito.length === 0 ? (
          <div className="text-center text-light mt-4">No hay productos en la lista.</div>
        ) : (
          carrito.map((item, index) => (
            <div key={index} className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1">
              {/* Columna Nombre */}
              <div style={{ width: '40%' }} className="d-flex align-items-center">
                <button 
                  className="btn btn-sm btn-link text-danger p-0 me-2" 
                  onClick={() => onEliminar(index)}
                  title="Eliminar"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
                <span className="text-light">{item.producto.nombreProducto}</span>
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