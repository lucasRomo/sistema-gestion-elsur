import React from 'react';

interface ModalSucesoProps {
  show: boolean;
  titulo: string;
  mensaje: string;
  tipo: string;
  onClose: () => void;
}

export const ModalSuceso: React.FC<ModalSucesoProps> = ({ show, titulo, mensaje, tipo, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div
          className="modal-content p-4 text-white text-center"
          style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}
        >
          <i className={`bi ${tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
          <h5 className="fw-bold">{titulo}</h5>
          <p className="small" style={{ color: '#a1a1aa' }}>{mensaje}</p>
          <button
            className={`btn ${tipo === 'exito' ? 'btn-secondary' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
