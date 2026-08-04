// src/features/productos/AumentoMasivoModal.tsx
import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';

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

    // Validaciones estrictas por criterio antes de procesar
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
        <div className="modal-content text-white border-info" style={{ backgroundColor: '#1e1e24', borderRadius: '12px' }}>
          
          <div className="modal-header border-secondary">
            <h5 className="modal-title font-monospace fw-bold text-info">
              <i className="bi bi-graph-up-arrow me-2"></i>Aplicar Aumento Porcentual Masivo
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body font-monospace">
              
              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label text-warning fw-bold">Porcentaje de Incremento (%):</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark text-info border-secondary">%</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control bg-dark text-white border-secondary"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Selección del Criterio */}
              <div className="mb-3">
                <label className="form-label fw-bold">Aplicar Aumento A:</label>
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
                    <label className="form-check-label" htmlFor="critTodos">
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
                    <label className="form-check-label" htmlFor="critCat">
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
                    <label className="form-check-label" htmlFor="critSel">
                      Selección de Productos
                    </label>
                  </div>
                </div>
              </div>

              {/* Filtro por Categoria */}
              {criterio === 'CATEGORIA' && (
                <div className="mb-3">
                  <label className="form-label text-info">Seleccionar Categoría:</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
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
                  <label className="form-label text-info">Seleccionar Productos Específicos:</label>
                  <div className="border border-secondary p-2 rounded bg-dark" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {productos.map((p) => (
                      <div key={p.idProducto} className="form-check text-start">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`p-${p.idProducto}`}
                          checked={productosSeleccionados.includes(p.idProducto!)}
                          onChange={() => handleToggleProducto(p.idProducto!)}
                        />
                        <label className="form-check-label text-white" htmlFor={`p-${p.idProducto}`}>
                          {p.nombreProducto} <span className="text-muted">(${p.precioBase})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={cargando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-info text-dark fw-bold px-4" disabled={cargando}>
                {cargando ? 'Procesando...' : 'Aplicar Aumento'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};