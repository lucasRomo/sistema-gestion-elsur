import React from 'react';

interface Props {
  titulo: string;
  mensaje: string;
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmarAccionModal: React.FC<Props> = ({
  titulo,
  mensaje,
  cardBg,
  textColor,
  mutedTextColor,
  onClose,
  onConfirm
}) => {
  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-secondary shadow-lg rounded-4" style={{ backgroundColor: cardBg, color: textColor }}>
          <div className="modal-header border-secondary">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-question-circle-fill text-warning me-2"></i>
              {titulo}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body py-4">
            <p className="mb-0">{mensaje}</p>
          </div>
          <div className="modal-footer border-secondary">
            <button type="button" className={`btn btn-sm ${mutedTextColor}`} onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm px-4 fw-bold" 
              style={{ backgroundColor: '#8e45e0', borderColor: '#8e45e0' }}
              onClick={onConfirm}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};