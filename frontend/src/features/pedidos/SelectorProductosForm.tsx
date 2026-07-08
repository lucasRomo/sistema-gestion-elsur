import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';
import type { CartItem } from '../../types/Pedido';

interface Props {
  productos: Producto[];
  carrito: CartItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onSiguiente: () => void;
  onCancelar: () => void;
}

export const SelectorProductosForm: React.FC<Props> = ({ 
  productos, carrito, setCarrito, onSiguiente, onCancelar 
}) => {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');

  const handleAgregar = () => {
    if (!productoId || Number(cantidad) <= 0) return;
    
    const prodSeleccionado = productos.find(p => p.idProducto === Number(productoId));
    if (!prodSeleccionado) return;

    const nuevoItem: CartItem = {
      producto: prodSeleccionado,
      cantidad: Number(cantidad),
      subtotal: prodSeleccionado.precioBase * Number(cantidad)
    };

    setCarrito([...carrito, nuevoItem]);
    setProductoId('');
    setCantidad('1');
  };

  const handleEliminar = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="card text-white p-4 mx-auto rounded" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46', maxWidth: '800px' }}>
      <h3 className="text-center mb-4 fw-normal font-monospace">Tabla para Calcular y Elegir Productos</h3>
      
      {/* selectores */}
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-7">
          <label className="form-label small text-secondary fw-bold">Producto:</label>
          <select 
            className="form-select bg-dark text-white border-secondary"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
          >
            <option value="">Seleccione un producto...</option>
            {productos.map(p => (
              <option key={p.idProducto} value={p.idProducto}>
                {p.nombreProducto} - ${p.precioBase}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-2">
          <label className="form-label small text-secondary fw-bold">Cantidad:</label>
          <input 
            type="number" 
            className="form-control bg-dark text-white border-secondary"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <button className="btn w-100 fw-bold text-white" style={{ backgroundColor: '#5a8ab8' }} onClick={handleAgregar}>
            Agregar
          </button>
        </div>
      </div>

      {/* tabla interna */}
      <div className="mb-4">
        <div className="d-flex text-secondary border-bottom border-secondary pb-2 mb-2 small fw-bold">
          <div style={{ width: '40%' }}>Lista de Productos:</div>
          <div style={{ width: '20%' }}>Cantidad:</div>
          <div style={{ width: '20%' }}>Precio Unitario:</div>
          <div style={{ width: '20%' }}>SubTotal:</div>
        </div>
        
        <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}>
          {carrito.length === 0 ? (
            <div className="text-center text-muted mt-4">No hay productos en la lista.</div>
          ) : (
            carrito.map((item, index) => (
              <div key={index} className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1">
                <div style={{ width: '40%' }} className="d-flex align-items-center">
                  <button className="btn btn-sm text-danger p-0 me-2" onClick={() => handleEliminar(index)}>
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                  <span>{item.producto.nombreProducto}</span>
                </div>
                <div style={{ width: '20%' }}>{item.cantidad}</div>
                <div style={{ width: '20%' }}>${item.producto.precioBase}</div>
                <div style={{ width: '20%' }} className="fw-bold text-info">${item.subtotal}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input de Total bloqueado */}
      <div className="mb-4">
        <label className="form-label small text-secondary fw-bold">Precio Total:</label>
        <input 
          type="text" 
          className="form-control bg-white text-dark fw-bold fs-5" 
          readOnly 
          value={`$${total.toLocaleString('es-AR')}`} 
        />
      </div>

      {/* Acciones del pie */}
      <div className="d-flex justify-content-between mt-3">
        <button className="btn btn-danger px-4" style={{ backgroundColor: '#a63333', border: 'none' }} onClick={onCancelar}>
          Cancelar
        </button>
        <div>
          <button className="btn btn-secondary px-4 me-2" disabled style={{ opacity: 0.5 }}>
            Generar Ticket Técnico
          </button>
          <button className="btn btn-success px-5" style={{ backgroundColor: '#3d824b', border: 'none' }} onClick={onSiguiente} disabled={carrito.length === 0}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};