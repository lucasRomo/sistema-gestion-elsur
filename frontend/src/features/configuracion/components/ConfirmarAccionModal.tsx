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
    <div
      className="modal d-block font-monospace"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div
          className="modal-content p-4 text-center shadow-lg"
          style={{
            border: '2px solid #8e45e0',
            backgroundColor: cardBg,
            borderRadius: '16px',
            color: textColor
          }}
        >
          <i className="bi bi-question-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
          <h5 className="fw-bold">{titulo}</h5>
          <p className={`small ${mutedTextColor}`}>{mensaje}</p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <button type="button" className="btn btn-danger btn-sm px-3" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-success btn-sm px-3 fw-bold" onClick={onConfirm}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};