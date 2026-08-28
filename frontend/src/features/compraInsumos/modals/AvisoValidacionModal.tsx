import React from 'react';

interface AvisoValidacionModalProps {
  mensaje: string;
  onClose: () => void;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
}

export const AvisoValidacionModal: React.FC<AvisoValidacionModalProps> = ({
  mensaje,
  onClose,
  isDark,
  cardBg,
  cardBorder,
  textColor
}) => {
  return (
    <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }} role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i> Validación
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>
          <div className="modal-body py-4">
            <p className="m-0 fs-6">{mensaje}</p>
          </div>
          <div className="modal-footer border-top border-secondary">
            <button type="button" className="btn btn-primary px-4 fw-bold" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};