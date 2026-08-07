import React, { useState } from 'react';
import type { Insumo } from '../../types/Insumo';
import { convertirInsumo } from '../../services/insumoService';

interface ConvertirInsumoModalProps {
  show: boolean;
  insumo: Insumo | null;
  onClose: () => void;
  onExito: (mensaje: string) => void;
}

export const ConvertirInsumoModal: React.FC<ConvertirInsumoModalProps> = ({ show, insumo, onClose, onExito }) => {
  const [cantidadBultos, setCantidadBultos] = useState<number>(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show || !insumo) return null;

  const unidadSuelta = insumo.unidadMedida?.nombre || 'unidades';
  const unidadBulto = insumo.unidadCompra?.nombre || 'bultos/resmas';
  const factor = insumo.factorConversion || 0;
  const stockBultos = insumo.stockEmpaquetado || 0;

  const totalSueltasAEmitir = (cantidadBultos || 0) * factor;

  const handleConvertir = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cantidadBultos <= 0) {
      setError("La cantidad a abrir debe ser mayor a 0.");
      return;
    }

    if (cantidadBultos > stockBultos) {
      setError(`No hay suficiente stock en bultos. Disponible: ${stockBultos}`);
      return;
    }

    if (factor <= 0) {
      setError("El insumo no tiene configurado un factor de conversión válido.");
      return;
    }

    try {
      setCargando(true);
      await convertirInsumo(insumo.idInsumo!, cantidadBultos);
      setCargando(false);
      onExito(`Se convirtieron ${cantidadBultos} ${unidadBulto} en ${totalSueltasAEmitir} ${unidadSuelta}.`);
      onClose();
    } catch (err: any) {
      setCargando(false);
      setError(err.message || "Ocurrió un error al convertir el stock.");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #10b981' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold" style={{ color: '#10b981' }}>
              <i className="bi bi-box-arrow-up-right me-2"></i> Registrar Conversión de Insumo
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleConvertir}>
            <div className="modal-body p-4">
              
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
                <h6 className="fw-bold text-white mb-1">{insumo.nombreInsumo}</h6>
                <div className="small text-white-50">
                  <span>Equivalencia: 1 <strong>{unidadBulto}</strong> = <strong>{factor} {unidadSuelta}</strong></span>
                </div>
                <div className="mt-2 d-flex justify-content-between small">
                  <span className="text-info">Stock Empaquetado: <strong>{stockBultos} {unidadBulto}</strong></span>
                  <span className="text-success">Stock Suelto: <strong>{insumo.stockActual} {unidadSuelta}</strong></span>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-white-50 small">Cantidad de Bultos/Resmas a Abrir</label>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  max={stockBultos}
                  className="form-control bg-dark border-secondary text-white fw-bold fs-5" 
                  value={cantidadBultos} 
                  onChange={(e) => setCantidadBultos(parseInt(e.target.value) || 0)} 
                  required 
                />
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: '#14532d', border: '1px solid #16a34a' }}>
                <div className="small text-white-50">Resultado de la conversión:</div>
                <div className="fw-bold text-white mt-1">
                  - {cantidadBultos} {unidadBulto} en Depósito
                </div>
                <div className="fw-bold text-light fs-6">
                  + {totalSueltasAEmitir} {unidadSuelta} al Stock Activo
                </div>
              </div>

            </div>

            <div className="modal-footer border-top border-secondary py-2">
              <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose} disabled={cargando}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-sm px-4 fw-bold text-white" 
                style={{ backgroundColor: '#10b981' }}
                disabled={cargando || stockBultos <= 0}
              >
                {cargando ? 'Procesando...' : 'Confirmar Conversión'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};