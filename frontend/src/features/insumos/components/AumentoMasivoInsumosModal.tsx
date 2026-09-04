import React, { useState, useMemo } from 'react';
import type { Insumo } from '../types/Insumo';
import { useTheme } from '../../../Context/ThemeContext';

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
  // Color naranja estático exacto
  const orangeColor = '#d37c0b';
  const modalBorder = orangeColor;
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const boxBg = isDark ? '#121214' : '#f8fafc';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [criterio, setCriterio] = useState<'TODOS' | 'PROVEEDOR' | 'SELECCION'>('TODOS');
  const [tipoOperacion, setTipoOperacion] = useState<'AUMENTO' | 'DESCUENTO'>('AUMENTO');
  const [porcentaje, setPorcentaje] = useState<number>(10);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<number[]>([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showProveedor, setShowProveedor] = useState(false);
  const [textoProveedor, setTextoProveedor] = useState('');

  // Buscador filtrado para selección manual
  const insumosFiltradosManual = useMemo(() => {
    if (!busquedaInsumo.trim()) return insumos;
    return insumos.filter(ins =>
      ins.nombreInsumo.toLowerCase().includes(busquedaInsumo.toLowerCase())
    );
  }, [insumos, busquedaInsumo]);

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

  const handleToggleTodosVisibles = () => {
    const idsVisibles = insumosFiltradosManual.map(i => i.idInsumo!).filter(Boolean);
    const todosSeleccionados = idsVisibles.every(id => insumosSeleccionados.includes(id));

    if (todosSeleccionados) {
      setInsumosSeleccionados(insumosSeleccionados.filter(id => !idsVisibles.includes(id)));
    } else {
      const nuevos = Array.from(new Set([...insumosSeleccionados, ...idsVisibles]));
      setInsumosSeleccionados(nuevos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!porcentaje || porcentaje <= 0) {
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

    // Convertir a valor negativo si es descuento
    const porcentajeFinal = tipoOperacion === 'DESCUENTO' ? -Math.abs(porcentaje) : Math.abs(porcentaje);

    setCargando(true);
    try {
      await onConfirmar({
        criterio,
        porcentaje: porcentajeFinal,
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
            <h5 className="modal-title fw-bold" style={{ color: orangeColor }}>
              <i className="bi bi-currency-exchange me-2" style={{ color: orangeColor }}></i>Modificación Masiva de Precios
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              
              {/* Opción de Aumento o Descuento */}
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ color: orangeColor }}>Tipo de Acción:</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoOperacion"
                      id="opAumento"
                      checked={tipoOperacion === 'AUMENTO'}
                      onChange={() => setTipoOperacion('AUMENTO')}
                    />
                    <label className="form-check-label fw-bold text-success" htmlFor="opAumento">
                      <i className="bi bi-arrow-up-circle me-1"></i> Aumento (+)
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoOperacion"
                      id="opDescuento"
                      checked={tipoOperacion === 'DESCUENTO'}
                      onChange={() => setTipoOperacion('DESCUENTO')}
                    />
                    <label className="form-check-label fw-bold text-danger" htmlFor="opDescuento">
                      <i className="bi bi-arrow-down-circle me-1"></i> Descuento / Disminución (-)
                    </label>
                  </div>
                </div>
              </div>

              {/* Porcentaje */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ color: orangeColor }}>
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

              {/* Selección del Criterio */}
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ color: labelColor }}>Aplicar A:</label>
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
                  <label className="form-label fw-semibold" style={{ color: orangeColor }}>Seleccionar Proveedor:</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      autoComplete="off"
                      className="form-control shadow-none"
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      placeholder="Escriba para buscar un proveedor..."
                      value={textoProveedor}
                      onChange={(e) => {
                        setTextoProveedor(e.target.value);
                        setProveedorSeleccionado(null);
                      }}
                      onFocus={() => setShowProveedor(true)}
                      onBlur={() => setTimeout(() => setShowProveedor(false), 200)}
                    />
                    {showProveedor && (
                      <div 
                        className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                        style={{ maxHeight: '180px', zIndex: 1060, border: `1px solid ${inputBorder}`, top: '100%', left: 0 }}
                      >
                        {proveedores.filter(([id, nombre]) => nombre.toLowerCase().includes(textoProveedor.toLowerCase())).length === 0 ? (
                          <div className="p-2 small text-muted text-center">Sin coincidencias</div>
                        ) : (
                          proveedores
                            .filter(([id, nombre]) => nombre.toLowerCase().includes(textoProveedor.toLowerCase()))
                            .map(([id, nombre]) => {
                              const isSelected = id === proveedorSeleccionado;
                              return (
                                <div
                                  key={id}
                                  className="p-2 border-bottom text-truncate"
                                  style={{ 
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    backgroundColor: isSelected ? orangeColor : (isDark ? '#27272a' : '#f8fafc'),
                                    color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                                  }}
                                  onMouseDown={() => {
                                    setProveedorSeleccionado(id);
                                    setTextoProveedor(nombre);
                                    setShowProveedor(false);
                                  }}
                                >
                                  <span className="fw-semibold">{nombre}</span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selección manual con buscador */}
              {criterio === 'SELECCION' && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0" style={{ color: orangeColor }}>Seleccionar Insumos Específicos:</label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 fw-bold"
                      style={{ color: orangeColor }}
                      onClick={handleToggleTodosVisibles}
                    >
                      Marcar / Desmarcar Visibles
                    </button>
                  </div>

                  {/* Campo de búsqueda dinámico */}
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2 shadow-none"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Escriba para filtrar insumos..."
                    value={busquedaInsumo}
                    onChange={(e) => setBusquedaInsumo(e.target.value)}
                  />

                  <div className="p-2 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${inputBorder}`, maxHeight: '200px', overflowY: 'auto' }}>
                    {insumosFiltradosManual.length === 0 ? (
                      <div className="text-center py-2 small" style={{ color: mutedText }}>
                        No hay insumos que coincidan con la búsqueda
                      </div>
                    ) : (
                      insumosFiltradosManual.map((ins) => (
                        <div key={ins.idInsumo} className="form-check text-start">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`ins-${ins.idInsumo}`}
                            checked={insumosSeleccionados.includes(ins.idInsumo!)}
                            onChange={() => handleToggleInsumo(ins.idInsumo!)}
                          />
                          <label className="form-check-label d-flex justify-content-between pe-2 w-100" htmlFor={`ins-${ins.idInsumo}`} style={{ color: textColor }}>
                            <span>{ins.nombreInsumo}</span>
                            <span style={{ color: mutedText }}>Precio: ${ins.precio} | Stock: {ins.stockActual}</span>
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
                className="btn btn-danger px-4" 
                onClick={onClose} 
                disabled={cargando}
                style={{ color: '#ffffff' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn fw-bold px-4" 
                disabled={cargando}
                style={{ 
                  backgroundColor: orangeColor, 
                  borderColor: orangeColor, 
                  color: '#ffffff' 
                }}
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