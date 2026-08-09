import React from 'react';

interface Props {
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmarRestauracionModal: React.FC<Props> = ({
  cardBg, textColor, mutedTextColor, onClose, onConfirm
}) => (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
      <div className="modal-content text-center p-4 shadow-lg" style={{ backgroundColor: cardBg, border: '1px solid #a855f7', borderRadius: '16px' }}>
        <div className="mb-3 text-warning">
          <i className="bi bi-exclamation-triangle fs-1" style={{ color: '#facc15' }}></i>
        </div>
        <h5 className="fw-bold mb-2" style={{ color: textColor, fontSize: '1.25rem' }}>¿Actualizar/Restaurar Datos?</h5>
        <p className={`${mutedTextColor} small mb-4 px-2`}>
          ¡ATENCIÓN! La restauración sobrescribirá los datos existentes. ¿Deseas continuar?
        </p>
        <div className="d-flex justify-content-center gap-3">
          <button type="button" className="btn px-4 fw-semibold text-white" style={{ backgroundColor: '#168616', borderRadius: '8px' }} onClick={onClose}>
            Volver
          </button>
          <button type="button" className="btn px-4 fw-semibold text-white" style={{ backgroundColor: '#e61111', borderRadius: '8px' }} onClick={onConfirm}>
            Sí, Actualizar
          </button>
        </div>
      </div>
    </div>
  </div>
);