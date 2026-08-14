import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ModalConfirmarDesvincular: React.FC<Props> = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1100 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div 
          className="modal-content p-4 text-white text-center" 
          style={{ 
            border: '2px solid #dc3545', 
            backgroundColor: '#1a1a1c', 
            borderRadius: '12px',
            fontFamily: 'monospace'
          }}
        >
          <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#dc3545' }}></i>
          <h5 className="fw-bold">¿Desvincular Comprobante?</h5>
          <p className="small" style={{ fontSize: '0.85rem' }}>
            ¿Estás seguro que querés desvincular este comprobante de este pedido?
          </p>

          <div className="d-flex gap-2 justify-content-center mt-3">
            <button 
              className="btn btn-sm btn-secondary fw-bold px-3"
              style={{ borderRadius: '6px' }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-sm btn-danger fw-bold px-3"
              style={{ borderRadius: '6px' }}
              onClick={onConfirm}
            >
              Desvincular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};