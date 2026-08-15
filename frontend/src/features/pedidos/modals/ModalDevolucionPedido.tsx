import React, { useState } from 'react';

interface Props {
  pedido: any;
  isDark: boolean;
  mutedText: string;
  onClose: () => void;
  onProcesar: (accion: 'REINICIAR' | 'DEVUELTO', descripcion: string) => Promise<void>;
}

export const ModalDevolucionPedido: React.FC<Props> = ({
  pedido,
  isDark,
  mutedText,
  onClose,
  onProcesar
}) => {
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  const handleConfirmar = async (accion: 'REINICIAR' | 'DEVUELTO') => {
    if (!descripcion.trim()) {
      setErrorValidacion('Por favor, ingresa una descripción para la devolución.');
      return;
    }
    setErrorValidacion('');
    setCargando(true);
    try {
      await onProcesar(accion, descripcion);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div 
          className="modal-content text-white font-monospace p-4 shadow-lg" 
          style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 text-warning">
              <i className="bi bi-arrow-return-left me-2"></i>Devolución de Pedido #{pedido.id_pedido}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`}
              onClick={onClose}
              disabled={cargando}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small" style={{ color: mutedText }}>Motivo / Descripción de la devolución</label>
            <textarea 
              className="form-control bg-dark text-white border-secondary font-monospace"
              rows={3}
              placeholder="Ingrese los detalles o la razón del reclamo/devolución..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={cargando}
            />
            {errorValidacion && <p className="text-danger small mt-1 mb-0">{errorValidacion}</p>}
          </div>

          <div className="d-flex flex-column gap-2 mt-4">
            <button 
              type="button" 
              disabled={cargando}
              className="btn btn-warning fw-bold py-2 shadow"
              onClick={() => handleConfirmar('REINICIAR')}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>Volver a Hacer
            </button>
            <button 
              type="button" 
              disabled={cargando}
              className="btn btn-danger fw-bold py-2 shadow"
              onClick={() => handleConfirmar('DEVUELTO')}
            >
              <i className="bi bi-x-circle me-2"></i>Marcar como Devuelto
            </button>
            <button 
              type="button" 
              disabled={cargando}
              className="btn btn-secondary fw-bold py-2"
              onClick={onClose}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};