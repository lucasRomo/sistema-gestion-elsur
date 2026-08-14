import React from 'react';

interface Props {
  show: boolean;
  mensaje: string;
  onClose: () => void;
}

export const ModalErrorStock: React.FC<Props> = ({ show, mensaje, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div 
          className="modal-content p-4 text-white text-center" 
          style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
        >
          <i className="bi bi-x-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
          <h5 className="fw-bold">Error por Falta de Stock</h5>
          <p className="small" style={{ color: '#a1a1aa' }}>{mensaje}</p>
          <button 
            className="btn btn-danger btn-sm px-4 mt-3 fw-bold"
            style={{ borderRadius: '6px' }}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};