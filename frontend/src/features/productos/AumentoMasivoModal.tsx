// src/features/productos/AumentoMasivoModal.tsx
import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';
import { useTheme } from '../../Context/ThemeContext';

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
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (porcentaje <= 0) {
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

    setCargando(true);
    try {
      await onConfirmar({
        criterio,
        porcentaje,
        idCategoria: criterio === 'CATEGORIA' ? categoriaSeleccionada : null,
        idsProductos: criterio === 'SELECCION' ? productosSeleccionados : []
      });
      onClose();
    } catch (err: any) {
      alert("Error al aplicar aumentos: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content shadow-lg" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `1.5px solid ${modalBorder}`, 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header" style={{ borderColor: headerBorder }}>
            <h5 className="modal-title font-monospace fw-bold text-info">
              <i className="bi bi-graph-up-arrow me-2"></i>Aplicar Aumento Porcentual Masivo
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body font-monospace">
              
              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label text-warning fw-bold">Porcentaje de Incremento (%):</label>
                <div className="input-group">
                  <span className="input-group-text fw-bold" style={{ backgroundColor: inputBg, color: '#0dcaf0', borderColor: inputBorder }}>%</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Selección del Criterio */}
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ color: labelColor }}>Aplicar Aumento A:</label>
                <div className="d-flex gap-3">
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
                      Selección de Productos
                    </label>
                  </div>
                </div>
              </div>

              {/* Filtro por Categoria */}
              {criterio === 'CATEGORIA' && (
                <div className="mb-3">
                  <label className="form-label text-info fw-semibold">Seleccionar Categoría:</label>
                  <select
                    className="form-select shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={categoriaSeleccionada || ''}
                    onChange={(e) => setCategoriaSeleccionada(Number(e.target.value))}
                    required
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categorias.map(([id, nombre]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selección manual de Productos */}
              {criterio === 'SELECCION' && (
                <div className="mb-3">
                  <label className="form-label text-info fw-semibold">Seleccionar Productos Específicos:</label>
                  <div className="p-2 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${inputBorder}`, maxHeight: '200px', overflowY: 'auto' }}>
                    {productos.map((p) => (
                      <div key={p.idProducto} className="form-check text-start">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`p-${p.idProducto}`}
                          checked={productosSeleccionados.includes(p.idProducto!)}
                          onChange={() => handleToggleProducto(p.idProducto!)}
                        />
                        <label className="form-check-label" htmlFor={`p-${p.idProducto}`} style={{ color: textColor }}>
                          {p.nombreProducto} <span style={{ color: mutedText }}>(${p.precioBase})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer" style={{ borderColor: headerBorder }}>
              <button 
                type="button" 
                className="btn btn-danger px-4" 
                onClick={onClose} 
                disabled={cargando}
                style={{ color: '#ffffff' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-info fw-bold px-4" 
                disabled={cargando}
                style={{ color: '#ffffff' }}
              >
                {cargando ? 'Procesando...' : 'Aplicar Aumento'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};