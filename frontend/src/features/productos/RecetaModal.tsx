import React, { useEffect, useState } from 'react';
import type { Producto } from '../../types/Producto';
import { useTheme } from '../../Context/ThemeContext';

interface Props {
  show: boolean;
  producto: Producto;
  onClose: () => void;
}

interface InsumoItem {
  idInsumo: number;
  nombreInsumo: string;
  unidadMedida: string;
  cantidadConsumo: number;
}

export const RecetaModal: React.FC<Props> = ({ show, producto, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const boxBg = isDark ? '#1b1b1b' : '#f8fafc';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const thBg = isDark ? '#1a1a1c' : '#f1f5f9';
  const thText = isDark ? '#a1a1aa' : '#475569';
  const rowBorder = isDark ? '#27272a' : '#e2e8f0';
  const mutedText = isDark ? '#a1a1aa' : '#64748b';

  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [recetaActual, setRecetaActual] = useState<InsumoItem[]>([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (show && producto) {
      cargarInsumos();
      cargarRecetaDelProducto();
    }
  }, [show, producto]);

  const obtenerNombreUnidad = (u: any): string => {
    if (!u) return 'Unidad';
    if (typeof u === 'object' && u.nombre) return u.nombre;
    if (typeof u === 'string') return u;
    return 'Unidad';
  };

  const cargarInsumos = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/insumos');
      if (res.ok) {
        const data = await res.json();
        setInsumosDisponibles(data);
      }
    } catch (e) {
      console.error("Error al cargar insumos:", e);
    }
  };

  const cargarRecetaDelProducto = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${producto.idProducto}`);
      if (res.ok) {
        const data = await res.json();
        const listaMapeada = data.map((pi: any) => ({
          idInsumo: pi.insumo?.idInsumo || pi.id?.idInsumo,
          nombreInsumo: pi.insumo?.nombreInsumo || 'Insumo',
          unidadMedida: obtenerNombreUnidad(pi.insumo?.unidadMedida),
          cantidadConsumo: pi.cantidadConsumo
        }));
        setRecetaActual(listaMapeada);
      }
    } catch (e) {
      console.error("Error al cargar receta:", e);
    }
  };

  const handleAgregarInsumo = () => {
    if (!insumoSeleccionado || !cantidad || Number(cantidad) <= 0) return;

    const idIns = Number(insumoSeleccionado);
    const insumoObj = insumosDisponibles.find(i => i.idInsumo === idIns);
    if (!insumoObj) return;

    const yaExiste = recetaActual.some(item => item.idInsumo === idIns);
    if (yaExiste) {
      setRecetaActual(recetaActual.map(item => 
        item.idInsumo === idIns 
          ? { ...item, cantidadConsumo: item.cantidadConsumo + Number(cantidad) }
          : item
      ));
    } else {
      setRecetaActual([
        ...recetaActual,
        {
          idInsumo: insumoObj.idInsumo,
          nombreInsumo: insumoObj.nombreInsumo,
          unidadMedida: obtenerNombreUnidad(insumoObj.unidadMedida),
          cantidadConsumo: Number(cantidad)
        }
      ]);
    }

    setInsumoSeleccionado('');
    setCantidad('');
  };

  const handleEliminarInsumo = (idInsumo: number) => {
    setRecetaActual(recetaActual.filter(item => item.idInsumo !== idInsumo));
  };

  const handleGuardarReceta = async () => {
    setLoading(true);
    try {
      const payload = recetaActual.map(item => ({
        idProducto: producto.idProducto,
        idInsumo: item.idInsumo,
        cantidadConsumo: item.cantidadConsumo
      }));

      const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${producto.idProducto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onClose();
      } else {
        alert('Ocurrió un error al guardar la receta.');
      }
    } catch (e) {
      console.error("Error guardando receta:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content shadow-lg" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `1px solid ${modalBorder}`, 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header border-bottom" style={{ borderColor: headerBorder }}>
            <h5 className="modal-title fw-bold text-warning">
              <i className="bi bi-box-seam me-2"></i>Receta / Insumos: {producto.nombreProducto}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <div className="row g-2 mb-4 align-items-end p-3 rounded" style={{ backgroundColor: boxBg, border: `1px solid ${inputBorder}` }}>
              <div className="col-md-6">
                <label className="form-label small fw-semibold" style={{ color: labelColor }}>Seleccionar Insumo</label>
                <select 
                  className="form-select shadow-none"
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  value={insumoSeleccionado}
                  onChange={(e) => setInsumoSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {insumosDisponibles.map(i => {
                    const nombreUnidad = obtenerNombreUnidad(i.unidadMedida);
                    return (
                      <option key={i.idInsumo} value={i.idInsumo}>
                        {i.nombreInsumo} ({nombreUnidad}) - Stock: {i.stockActual}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold" style={{ color: labelColor }}>Cantidad a consumir</label>
                <input 
                  type="number" 
                  step="0.0001"
                  min="0.0001"
                  className="form-control shadow-none"
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  placeholder="Ej: 1.5"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-warning w-100 fw-bold" 
                  onClick={handleAgregarInsumo}
                  style={{ color: '#ffffff' }}
                >
                  Agregar
                </button>
              </div>
            </div>

            <h6 className="fw-bold mb-3" style={{ color: textColor }}>Insumos que componen el producto:</h6>
            <div className="table-responsive">
              <table className="w-100 align-middle mb-0" style={{ color: textColor, borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="border-bottom" style={{ borderColor: rowBorder, color: thText, backgroundColor: thBg }}>
                    <th className="py-2 px-3 fw-bold">Insumo</th>
                    <th className="py-2 px-3 fw-bold">Unidad</th>
                    <th className="py-2 px-3 fw-bold">Cantidad por Unidad de Producto</th>
                    <th className="py-2 px-3 fw-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {recetaActual.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4" style={{ color: mutedText }}>
                        Este producto no tiene insumos configurados aún.
                      </td>
                    </tr>
                  ) : (
                    recetaActual.map((item) => (
                      <tr key={item.idInsumo} className="border-bottom" style={{ borderColor: rowBorder }}>
                        <td className="fw-semibold py-2 px-3">{item.nombreInsumo}</td>
                        <td className="py-2 px-3" style={{ color: mutedText }}>{item.unidadMedida}</td>
                        <td className="text-info fw-bold py-2 px-3">{item.cantidadConsumo}</td>
                        <td className="text-center py-2 px-3">
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleEliminarInsumo(item.idInsumo)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-top" style={{ borderColor: headerBorder }}>
            <button 
              className="btn btn-danger px-4" 
              onClick={onClose}
              style={{ color: '#ffffff' }}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-success px-4 fw-bold" 
              onClick={handleGuardarReceta}
              disabled={loading}
              style={{ color: '#ffffff' }}
            >
              {loading ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};