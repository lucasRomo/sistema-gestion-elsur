import React from 'react';
import type { Producto } from '../../types/Producto';

interface Props {
  productos: Producto[];
  productoId: string;
  setProductoId: (id: string) => void;
  cantidad: string;
  setCantidad: (cant: string) => void;
  onAgregar: () => void;
}

export const SelectorProducto: React.FC<Props> = ({ 
  productos, productoId, setProductoId, cantidad, setCantidad, onAgregar 
}) => {
  return (
    <div className="row g-3 mb-4 align-items-end">
      <div className="col-md-7">
        <label className="form-label small text-light">Producto:</label> {/* Añadido text-light */}
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
        <label className="form-label small text-light">Cantidad:</label> {/* Añadido text-light */}
        <input 
          type="number" 
          className="form-control bg-dark text-white border-secondary"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
      </div>

      <div className="col-md-3">
        <button 
          className="btn w-100 fw-bold" 
          style={{ backgroundColor: '#5a8ab8', color: 'white' }}
          onClick={onAgregar}
        >
          Agregar
        </button>
      </div>
    </div>
  );
};