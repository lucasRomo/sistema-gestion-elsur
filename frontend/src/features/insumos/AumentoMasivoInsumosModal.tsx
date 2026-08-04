// src/features/insumos/AumentoMasivoInsumosModal.tsx
import React, { useState } from 'react';
import type { Insumo } from '../../types/Insumo';

interface Props {
  show: boolean;
  insumos: Insumo[];
  onClose: () => void;
  onConfirmar: (data: {
    criterio: 'TODOS' | 'PROVEEDOR' | 'SELECCION';
    porcentaje: number;
    idProveedor?: number | null;
    idsInsumos?: number[];
  }) => Promise<void>;
}

export const AumentoMasivoInsumosModal: React.FC<Props> = ({
  show,
  insumos,
  onClose,
  onConfirmar
}) => {
  const [criterio, setCriterio] = useState<'TODOS' | 'PROVEEDOR' | 'SELECCION'>('TODOS');
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  if (!show) return null;

  // Extraer proveedores únicos usando únicamente nombreComercial
  const proveedoresMap = new Map<number, string>();
  insumos.forEach(i => {
    if (i.proveedor && i.proveedor.idProveedor) {
      const nombre = i.proveedor.nombreComercial || `Proveedor #${i.proveedor.idProveedor}`;
      proveedoresMap.set(i.proveedor.idProveedor, nombre);
    }
  });
  const proveedores = Array.from(proveedoresMap.entries());

  const handleToggleInsumo = (id: number) => {
    if (insumosSeleccionados.includes(id)) {
      setInsumosSeleccionados(insumosSeleccionados.filter(item => item !== id));
    } else {
      setInsumosSeleccionados([...insumosSeleccionados, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (porcentaje <= 0) {
      alert("Ingrese un porcentaje válido mayor a 0");
      return;
    }

    // Validaciones estrictas por criterio antes de procesar
    if (criterio === 'PROVEEDOR' && !proveedorSeleccionado) {
      alert("Por favor seleccione un proveedor de la lista");
      return;
    }

    if (criterio === 'SELECCION' && insumosSeleccionados.length === 0) {
      alert("Por favor seleccione al menos un insumo de la lista");
      return;
    }

    setCargando(true);
    try {
      await onConfirmar({
        criterio,
        porcentaje,
        idProveedor: criterio === 'PROVEEDOR' ? proveedorSeleccionado : null,
        idsInsumos: criterio === 'SELECCION' ? insumosSeleccionados : []
      });
      onClose();
    } catch (err: any) {
      alert("Error al procesar: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content text-white border-success" style={{ backgroundColor: '#1e1e24', borderRadius: '12px' }}>
          
          <div className="modal-header border-secondary">
            <h5 className="modal-title font-monospace fw-bold text-success">
              <i className="bi bi-graph-up-arrow me-2"></i>Aumento Masivo de Insumos
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body font-monospace">
              
              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label text-warning fw-bold">Porcentaje de Incremento (%):</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark text-success border-secondary">%</span>
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
                <div className="d-flex gap-3 flex-wrap">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterioInsumo"
                      id="critInsTodos"
                      checked={criterio === 'TODOS'}
                      onChange={() => setCriterio('TODOS')}
                    />
                    <label className="form-check-label" htmlFor="critInsTodos">
                      Todos los Insumos
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterioInsumo"
                      id="critInsProv"
                      checked={criterio === 'PROVEEDOR'}
                      onChange={() => setCriterio('PROVEEDOR')}
                    />
                    <label className="form-check-label" htmlFor="critInsProv">
                      Por Proveedor
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="criterioInsumo"
                      id="critInsSel"
                      checked={criterio === 'SELECCION'}
                      onChange={() => setCriterio('SELECCION')}
                    />
                    <label className="form-check-label" htmlFor="critInsSel">
                      Selección Manual
                    </label>
                  </div>
                </div>
              </div>

              {/* Filtro por Proveedor */}
              {criterio === 'PROVEEDOR' && (
                <div className="mb-3">
                  <label className="form-label text-success">Seleccionar Proveedor:</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={proveedorSeleccionado || ''}
                    onChange={(e) => setProveedorSeleccionado(Number(e.target.value))}
                    required
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {proveedores.map(([id, nombre]) => (
                      <option key={id} value={id}>{nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selección manual de Insumos */}
              {criterio === 'SELECCION' && (
                <div className="mb-3">
                  <label className="form-label text-success">Seleccionar Insumos Específicos:</label>
                  <div className="border border-secondary p-2 rounded bg-dark" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {insumos.map((ins) => (
                      <div key={ins.idInsumo} className="form-check text-start">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`ins-${ins.idInsumo}`}
                          checked={insumosSeleccionados.includes(ins.idInsumo!)}
                          onChange={() => handleToggleInsumo(ins.idInsumo!)}
                        />
                        <label className="form-check-label text-white" htmlFor={`ins-${ins.idInsumo}`}>
                          {ins.nombreInsumo} <span className="text-muted">(Stock: {ins.stockActual})</span>
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
              <button type="submit" className="btn btn-success fw-bold px-4" disabled={cargando}>
                {cargando ? 'Procesando...' : 'Aplicar Aumento'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};