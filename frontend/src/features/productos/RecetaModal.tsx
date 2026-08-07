import React, { useEffect, useState } from 'react';
import type { Producto } from '../../types/Producto';

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

  // Convierte el valor de unidadMedida (ya sea string u objeto) a un string plano legible
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
        <div className="modal-content text-white" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46', borderRadius: '12px' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold text-warning">
              <i className="bi bi-box-seam me-2"></i>Receta / Insumos: {producto.nombreProducto}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="row g-2 mb-4 align-items-end p-3 rounded" style={{ backgroundColor: '#27272a' }}>
              <div className="col-md-6">
                <label className="form-label small text-white-50">Seleccionar Insumo</label>
                <select 
                  className="form-select bg-dark text-white border-secondary"
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
                <label className="form-label small text-white-50">Cantidad a consumir</label>
                <input 
                  type="number" 
                  step="0.0001"
                  min="0.0001"
                  className="form-input bg-dark text-white border-secondary form-control"
                  placeholder="Ej: 1.5"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-warning w-100 fw-bold" 
                  onClick={handleAgregarInsumo}
                >
                  Agregar
                </button>
              </div>
            </div>

            <h6 className="fw-bold mb-3">Insumos que componen el producto:</h6>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle">
                <thead>
                  <tr className="text-secondary border-bottom border-secondary">
                    <th>Insumo</th>
                    <th>Unidad</th>
                    <th>Cantidad por Unidad de Producto</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {recetaActual.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        Este producto no tiene insumos configurados aún.
                      </td>
                    </tr>
                  ) : (
                    recetaActual.map((item) => (
                      <tr key={item.idInsumo}>
                        <td className="fw-semibold">{item.nombreInsumo}</td>
                        <td>{item.unidadMedida}</td>
                        <td className="text-info fw-bold">{item.cantidadConsumo}</td>
                        <td className="text-center">
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

          <div className="modal-footer border-top border-secondary">
            <button className="btn btn-secondary px-4" onClick={onClose}>Cancelar</button>
            <button 
              className="btn btn-success px-4 fw-bold" 
              onClick={handleGuardarReceta}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};