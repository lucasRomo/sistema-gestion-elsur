import React, { useState, useMemo } from 'react';
import type { Producto } from '../types/Producto';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  productos: Producto[];
  onClose: () => void;
  onConfirmar: (data: {
    criterio: 'TODOS' | 'CATEGORIA' | 'SELECCION';
    porcentaje: number;
    idCategoria?: number | null;
    idsProductos?: number[];
  }) => Promise<void>;
}

export const AumentoMasivoModal: React.FC<Props> = ({
  show,
  productos,
  onClose,
  onConfirmar
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#17a2b8' : '#0dcaf0';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const boxBg = isDark ? '#121214' : '#f8fafc';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [criterio, setCriterio] = useState<'TODOS' | 'CATEGORIA' | 'SELECCION'>('TODOS');
  const [tipoOperacion, setTipoOperacion] = useState<'AUMENTO' | 'DESCUENTO'>('AUMENTO');
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showCategoria, setShowCategoria] = useState(false);

  // Buscador dinámico para selección manual
  const productosFiltradosManual = useMemo(() => {
    if (!busquedaProducto.trim()) return productos;
    return productos.filter(p =>
      p.nombreProducto?.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [productos, busquedaProducto]);

  if (!show) return null;

  // Extraer categorías únicas disponibles
  const categoriasMap = new Map();
  productos.forEach(p => {
    if (p.categoria) {
      categoriasMap.set(p.categoria.idCategoria, p.categoria.nombre);
    }
  });
  const categorias = Array.from(categoriasMap.entries());

  const handleToggleProducto = (id: number) => {
    if (productosSeleccionados.includes(id)) {
      setProductosSeleccionados(productosSeleccionados.filter(i => i !== id));
    } else {
      setProductosSeleccionados([...productosSeleccionados, id]);
    }
  };

  const handleToggleTodosVisibles = () => {
    const idsVisibles = productosFiltradosManual.map(p => p.idProducto!).filter(Boolean);
    const todosSeleccionados = idsVisibles.every(id => productosSeleccionados.includes(id));

    if (todosSeleccionados) {
      setProductosSeleccionados(productosSeleccionados.filter(id => !idsVisibles.includes(id)));
    } else {
      const nuevos = Array.from(new Set([...productosSeleccionados, ...idsVisibles]));
      setProductosSeleccionados(nuevos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!porcentaje || porcentaje <= 0) {
      alert("Ingrese un porcentaje válido mayor a 0");
      return;
    }

    if (criterio === 'CATEGORIA' && !categoriaSeleccionada) {
      alert("Por favor seleccione una categoría de la lista");
      return;
    }

    if (criterio === 'SELECCION' && productosSeleccionados.length === 0) {
      alert("Por favor seleccione al menos un producto de la lista");
      return;
    }

    // Convertir a negativo si es un descuento/disminución de precio
    const porcentajeFinal = tipoOperacion === 'DESCUENTO' ? -Math.abs(porcentaje) : Math.abs(porcentaje);

    setCargando(true);
    try {
      await onConfirmar({
        criterio,
        porcentaje: porcentajeFinal,
        idCategoria: criterio === 'CATEGORIA' ? categoriaSeleccionada : null,
        idsProductos: criterio === 'SELECCION' ? productosSeleccionados : []
      });
      onClose();
    } catch (err: any) {
      alert("Error al aplicar modificaciones de precio: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content shadow-lg font-monospace" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `1.5px solid ${modalBorder}`, 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header" style={{ borderColor: headerBorder }}>
            <h5 className="modal-title fw-bold text-info-custom">
              <i className="bi bi-currency-exchange me-2"></i>Modificación Masiva de Precios de Productos
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              
              {/* Selector Aumento / Descuento */}
              <div className="mb-3">
                <label className="form-label text-warning fw-bold">Tipo de Acción:</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoOperacionProd"
                      id="opAumentoProd"
                      checked={tipoOperacion === 'AUMENTO'}
                      onChange={() => setTipoOperacion('AUMENTO')}
                    />
                    <label className="form-check-label fw-bold text-success" htmlFor="opAumentoProd">
                      <i className="bi bi-arrow-up-circle me-1"></i> Aumento (+)
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoOperacionProd"
                      id="opDescuentoProd"
                      checked={tipoOperacion === 'DESCUENTO'}
                      onChange={() => setTipoOperacion('DESCUENTO')}
                    />
                    <label className="form-check-label fw-bold text-danger" htmlFor="opDescuentoProd">
                      <i className="bi bi-arrow-down-circle me-1"></i> Descuento / Disminución (-)
                    </label>
                  </div>
                </div>
              </div>

              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label text-warning fw-bold">
                  Porcentaje de {tipoOperacion === 'AUMENTO' ? 'Incremento' : 'Disminución'} (%):
                </label>
                <div className="input-group">
                  <span className={`input-group-text fw-bold ${tipoOperacion === 'AUMENTO' ? 'text-success' : 'text-danger'}`} style={{ backgroundColor: inputBg, borderColor: inputBorder }}>
                    {tipoOperacion === 'AUMENTO' ? '+' : '-'}%
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Criterio de Selección */}
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ color: labelColor }}>Aplicar A:</label>
                <div className="d-flex gap-3 flex-wrap">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterio"
                      id="critTodos"
                      checked={criterio === 'TODOS'}
                      onChange={() => setCriterio('TODOS')}
                    />
                    <label className="form-check-label" htmlFor="critTodos" style={{ color: textColor }}>
                      Todos los Productos
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterio"
                      id="critCat"
                      checked={criterio === 'CATEGORIA'}
                      onChange={() => setCriterio('CATEGORIA')}
                    />
                    <label className="form-check-label" htmlFor="critCat" style={{ color: textColor }}>
                      Por Categoría
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterio"
                      id="critSel"
                      checked={criterio === 'SELECCION'}
                      onChange={() => setCriterio('SELECCION')}
                    />
                    <label className="form-check-label" htmlFor="critSel" style={{ color: textColor }}>
                      Selección Manual
                    </label>
                  </div>
                </div>
              </div>

              {criterio === 'CATEGORIA' && (
  <div className="mb-3">
    <label className="form-label text-info fw-semibold">Seleccionar Categoría:</label>
    <div className="position-relative">
      <input
        type="text"
        readOnly
        autoComplete="off"
        className="form-control shadow-none"
        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder, cursor: 'pointer' }}
        value={
          categoriaSeleccionada
            ? categorias.find(([id]) => id === categoriaSeleccionada)?.[1] ?? ''
            : '-- Seleccionar Categoría --'
        }
        onFocus={() => setShowCategoria(true)}
        onClick={() => setShowCategoria(true)}
        onBlur={() => setTimeout(() => setShowCategoria(false), 200)}
      />
      {showCategoria && (
        <div
          className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
          style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
        >
          {categorias.map(([id, nombre]) => {
            const isSelected = id === categoriaSeleccionada;
            return (
              <div
                key={id}
                className="p-2 border-bottom text-truncate"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                  color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                }}
                onMouseDown={() => {
                  setCategoriaSeleccionada(id);
                  setShowCategoria(false);
                }}
              >
                <span className="fw-semibold">{nombre}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}

              {/* Selección manual de Productos con Buscador */}
              {criterio === 'SELECCION' && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label text-info fw-semibold mb-0">Seleccionar Productos Específicos:</label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 fw-bold"
                      style={{ color: '#0dcaf0' }}
                      onClick={handleToggleTodosVisibles}
                    >
                      Marcar / Desmarcar Visibles
                    </button>
                  </div>

                  {/* Input del buscador dinámico */}
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2 shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Escriba para filtrar productos..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                  />

                  <div className="p-2 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${inputBorder}`, maxHeight: '200px', overflowY: 'auto' }}>
                    {productosFiltradosManual.length === 0 ? (
                      <div className="text-center py-2 small" style={{ color: mutedText }}>
                        No hay productos que coincidan con la búsqueda
                      </div>
                    ) : (
                      productosFiltradosManual.map((p) => (
                        <div key={p.idProducto} className="form-check text-start">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`p-${p.idProducto}`}
                            checked={productosSeleccionados.includes(p.idProducto!)}
                            onChange={() => handleToggleProducto(p.idProducto!)}
                          />
                          <label className="form-check-label d-flex justify-content-between pe-2 w-100" htmlFor={`p-${p.idProducto}`} style={{ color: textColor }}>
                            <span>{p.nombreProducto}</span>
                            <span style={{ color: mutedText }}>Precio Base: ${p.precioBase}</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer" style={{ borderColor: headerBorder }}>
              <button 
                type="button" 
                className="btn fw-bold btn-danger px-4" 
                onClick={onClose} 
                disabled={cargando}
                style={{ color: '#ffffff' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={`btn fw-bold px-4 ${tipoOperacion === 'AUMENTO' ? 'btn-info' : 'btn-warning'}`} 
                disabled={cargando}
                style={{ color: '#ffffff' }}
              >
                {cargando ? 'Procesando...' : (tipoOperacion === 'AUMENTO' ? 'Aplicar Aumento' : 'Aplicar Descuento')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};