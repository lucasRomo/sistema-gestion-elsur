import React, { useState, useMemo, useEffect } from 'react';
import type { Producto } from '../../productos/types/Producto';
import { useTheme } from '../../../Context/ThemeContext';

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

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const borderTheme = isDark ? '#3f3f46' : '#cbd5e1';

  // Sincronizar el campo de búsqueda cuando se limpia el producto seleccionando o agregando
  useEffect(() => {
    if (!productoId) {
      setBusquedaProducto('');
    }
  }, [productoId]);

  // Filtrado reactivo de productos según lo que escriba el usuario
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return productos;
    return productos.filter(p => 
      p.nombreProducto.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [productos, busquedaProducto]);

  return (
    <div className="row g-3 mb-4 align-items-end">
      <div className="col-md-7 position-relative">
        <label className={`form-label small fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>
          Buscar Producto:
        </label>
        <input 
          type="text"
          className={`form-control ${isDark ? 'bg-dark text-white border-secondary' : 'bg-white text-dark border-secondary-subtle'}`}
          placeholder="Escriba el nombre del producto..."
          value={busquedaProducto}
          onChange={(e) => {
            setBusquedaProducto(e.target.value);
            setProductoId('');
            setMostrarDropdown(true);
          }}
          onFocus={() => setMostrarDropdown(true)}
          onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
        />

        {/* Menú desplegable flotante para resultados de búsqueda */}
        {mostrarDropdown && (
          <div 
            className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
            style={{ maxHeight: '220px', zIndex: 1050, border: `1px solid ${borderTheme}`, left: 0 }}
          >
            {productosFiltrados.length === 0 ? (
              <div className="p-3 small text-muted text-center">No se encontraron productos coincidentes</div>
            ) : (
              productosFiltrados.map((p) => {
                const esSeleccionado = String(p.idProducto) === productoId;
                return (
                  <div
                    key={p.idProducto}
                    className="p-2 border-bottom d-flex justify-content-between align-items-center"
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: esSeleccionado 
                        ? '#0284c7' 
                        : (isDark ? '#27272a' : '#f8fafc')
                    }}
                    onMouseDown={() => {
                      setProductoId(String(p.idProducto));
                      setBusquedaProducto(`${p.nombreProducto} - $${p.precioBase}`);
                      setMostrarDropdown(false);
                    }}
                  >
                    <span className="fw-semibold small">{p.nombreProducto}</span>
                    <span className="badge bg-secondary ms-2">${p.precioBase}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      <div className="col-md-2">
        <label className={`form-label small fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>
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
          disabled={!productoId}
        >
          Agregar
        </button>
      </div>
    </div>
  );
};