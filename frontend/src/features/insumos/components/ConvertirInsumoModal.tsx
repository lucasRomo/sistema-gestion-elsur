import React, { useState } from 'react';
import type { Insumo } from '../types/Insumo';
import { convertirInsumo } from '../services/insumoService';
import { useTheme } from '../../../Context/ThemeContext';

interface ConvertirInsumoModalProps {
  show: boolean;
  insumo: Insumo | null;
  onClose: () => void;
  onExito: (mensaje: string) => void;
}

export const ConvertirInsumoModal: React.FC<ConvertirInsumoModalProps> = ({ show, insumo, onClose, onExito }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#10b981' : '#059669';
  const headerBorder = isDark ? '#27272a' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#18181b' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const infoBoxBg = isDark ? '#18181b' : '#f8fafc';
  const resultBoxBg = isDark ? '#14532d' : '#dcfce7';
  const resultBoxBorder = isDark ? '#16a34a' : '#86efac';
  const resultTextColor = isDark ? '#ffffff' : '#14532d';

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
        <div 
          className="modal-content font-monospace shadow-lg" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `1.5px solid ${modalBorder}`, 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header border-bottom" style={{ borderColor: headerBorder }}>
            <h5 className="modal-title fw-bold" style={{ color: '#10b981' }}>
              <i className="bi bi-box-arrow-up-right me-2"></i> Registrar Conversión de Insumo
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleConvertir}>
            <div className="modal-body p-4">
              
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: infoBoxBg, border: `1px solid ${inputBorder}` }}>
                <h6 className="fw-bold mb-1" style={{ color: textColor }}>{insumo.nombreInsumo}</h6>
                <div className="small" style={{ color: labelColor }}>
                  <span>Equivalencia: 1 <strong>{unidadBulto}</strong> = <strong>{factor} {unidadSuelta}</strong></span>
                </div>
                <div className="mt-2 d-flex justify-content-between small">
                  <span className="text-info-custom fw-semibold">Stock Empaquetado: <strong>{stockBultos} {unidadBulto}</strong></span>
                  <span className="text-success fw-semibold">Stock Suelto: <strong>{insumo.stockActual} {unidadSuelta}</strong></span>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-semibold" style={{ color: labelColor }}>Cantidad de Bultos/Resmas a Abrir</label>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  max={stockBultos}
                  className="form-control fw-bold fs-5 shadow-none" 
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  value={cantidadBultos} 
                  onChange={(e) => setCantidadBultos(parseInt(e.target.value) || 0)} 
                  required 
                />
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: resultBoxBg, border: `1px solid ${resultBoxBorder}` }}>
                <div className="small fw-semibold" style={{ color: isDark ? '#a1a1aa' : '#166534' }}>Resultado de la conversión:</div>
                <div className="fw-bold mt-1" style={{ color: resultTextColor }}>
                  - {cantidadBultos} {unidadBulto} en Depósito
                </div>
                <div className="fw-bold fs-6" style={{ color: resultTextColor }}>
                  + {totalSueltasAEmitir} {unidadSuelta} al Stock Activo
                </div>
              </div>

            </div>

            <div className="modal-footer border-top py-2" style={{ borderColor: headerBorder }}>
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
                className="btn px-4 fw-bold" 
                style={{ backgroundColor: '#1b9945', color: '#ffffff' }}
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