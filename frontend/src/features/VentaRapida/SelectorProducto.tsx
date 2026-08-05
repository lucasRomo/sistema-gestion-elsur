import React from 'react';
import type { Producto } from '../../types/Producto';
import { useTheme } from '../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="row g-3 mb-4 align-items-end">
      <div className="col-md-7">
        <label className={`form-label small ${isDark ? 'text-light' : 'text-dark'}`}>
          Producto:
        </label>
        <select 
          className={`form-select ${isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-secondary-subtle'}`}
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
        <label className={`form-label small ${isDark ? 'text-light' : 'text-dark'}`}>
          Cantidad:
        </label>
        <input 
          type="number" 
          className={`form-control ${isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-secondary-subtle'}`}
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