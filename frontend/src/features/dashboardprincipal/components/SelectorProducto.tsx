import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Producto } from '../../productos/types/Producto';
import { useTheme } from '../../../Context/ThemeContext';
import { formatearMonto, normalizarTexto } from '../../../utils/formato';

interface Props {
  productos: Producto[];
  productoId: string;
  setProductoId: (id: string) => void;
  cantidad: string;
  setCantidad: (cant: string) => void;
  onAgregar: () => void;
  stockPorProducto?: Record<string, number>;
}

export const SelectorProducto: React.FC<Props> = ({
  productos, productoId, setProductoId, cantidad, setCantidad, onAgregar, stockPorProducto = {}
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const busquedaRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  // Atajos de mostrador: Enter en la búsqueda elige el primer resultado y pasa a la cantidad;
  // Enter en la cantidad agrega al carrito y vuelve a la búsqueda para el próximo producto.
  const agregarConTeclado = () => {
    if (!productoId) return;
    onAgregar();
    setBusquedaProducto('');
    setTimeout(() => busquedaRef.current?.focus(), 0);
  };

  const borderTheme = isDark ? '#3f3f46' : '#cbd5e1';

  useEffect(() => {
    if (!productoId) {
      setBusquedaProducto('');
    }
  }, [productoId]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return productos;
    return productos.filter(p =>
      normalizarTexto(p.nombreProducto).includes(normalizarTexto(busquedaProducto))
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
          ref={busquedaRef}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (productoId) {
              agregarConTeclado();
            } else if (productosFiltrados.length > 0) {
              const primero = productosFiltrados[0];
              setProductoId(String(primero.idProducto));
              setBusquedaProducto(`${primero.nombreProducto} - $${formatearMonto(primero.precioBase)}`);
              setMostrarDropdown(false);
              setTimeout(() => cantidadRef.current?.select(), 0);
            }
          }}
        />

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
                      setBusquedaProducto(`${p.nombreProducto} - $${formatearMonto(p.precioBase)}`);
                      setMostrarDropdown(false);
                    }}
                  >
                    <span className="fw-semibold small">{p.nombreProducto}</span>
                    <span className="d-flex align-items-center gap-1 flex-shrink-0">
                      {stockPorProducto[String(p.idProducto)] !== undefined && (
                        <span
                          className="d-inline-block fw-bold rounded-pill"
                          style={(() => {
                            // Colores distintos por tema: el verde claro de modo oscuro casi no
                            // se leía sobre el fondo blanco del modo claro.
                            const hay = stockPorProducto[String(p.idProducto)] > 0;
                            const color = hay ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#f87171' : '#b91c1c');
                            const fondo = hay ? (isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7') : (isDark ? 'rgba(220,53,69,0.15)' : '#fee2e2');
                            return { backgroundColor: fondo, border: `1px solid ${color}`, color, fontSize: '0.72rem', padding: '2px 8px', lineHeight: 1.4, whiteSpace: 'nowrap' as const };
                          })()}
                          title="Stock disponible"
                        >
                          {stockPorProducto[String(p.idProducto)] > 0 ? `Stock: ${stockPorProducto[String(p.idProducto)]}` : 'Sin stock'}
                        </span>
                      )}
                      <span className="badge bg-secondary ms-1">${formatearMonto(p.precioBase)}</span>
                    </span>
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
          ref={cantidadRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregarConTeclado();
            }
          }}
        />
      </div>

      <div className="col-md-3">
        <button
          className="btn w-100 fw-bold"
          style={{ backgroundColor: '#27ace6', borderColor: '#27ace6',  color: 'white' }}
          onClick={onAgregar}
          disabled={!productoId}
        >
          Agregar
        </button>
      </div>

      <div className="col-12 small d-none d-md-flex gap-3 flex-wrap" style={{ color: isDark ? '#a1a1aa' : '#64748b', fontSize: '0.75rem' }}>
        <span><kbd>Enter</kbd> elegir / agregar</span>
        <span><kbd>F2</kbd> cobrar</span>
        <span><kbd>Esc</kbd> cancelar venta</span>
      </div>
    </div>
  );
};