// src/features/insumos/AumentoMasivoInsumosModal.tsx
import React, { useState } from 'react';
import type { Insumo } from '../../types/Insumo';
import { useTheme } from '../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#10b981' : '#198754';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const boxBg = isDark ? '#121214' : '#f8fafc';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [criterio, setCriterio] = useState<'TODOS' | 'PROVEEDOR' | 'SELECCION'>('TODOS');
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);

  if (!show) return null;

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
            <h5 className="modal-title fw-bold text-success">
              <i className="bi bi-graph-up-arrow me-2"></i>Aumento Masivo de Insumos
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              
              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label text-warning fw-bold">Porcentaje de Incremento (%):</label>
                <div className="input-group">
                  <span className="input-group-text text-success fw-bold" style={{ backgroundColor: inputBg, borderColor: inputBorder }}>%</span>
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
                    <label className="form-check-label" htmlFor="critInsTodos" style={{ color: textColor }}>
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
                    <label className="form-check-label" htmlFor="critInsProv" style={{ color: textColor }}>
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
                    <label className="form-check-label" htmlFor="critInsSel" style={{ color: textColor }}>
                      Selección Manual
                    </label>
                  </div>
                </div>
              </div>

              {/* Filtro por Proveedor */}
              {criterio === 'PROVEEDOR' && (
                <div className="mb-3">
                  <label className="form-label text-success fw-semibold">Seleccionar Proveedor:</label>
                  <select
                    className="form-select shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
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
                  <label className="form-label text-success fw-semibold">Seleccionar Insumos Específicos:</label>
                  <div className="p-2 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${inputBorder}`, maxHeight: '200px', overflowY: 'auto' }}>
                    {insumos.map((ins) => (
                      <div key={ins.idInsumo} className="form-check text-start">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`ins-${ins.idInsumo}`}
                          checked={insumosSeleccionados.includes(ins.idInsumo!)}
                          onChange={() => handleToggleInsumo(ins.idInsumo!)}
                        />
                        <label className="form-check-label" htmlFor={`ins-${ins.idInsumo}`} style={{ color: textColor }}>
                          {ins.nombreInsumo} <span style={{ color: mutedText }}>(Stock: {ins.stockActual})</span>
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
                className="btn btn-success fw-bold px-4" 
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