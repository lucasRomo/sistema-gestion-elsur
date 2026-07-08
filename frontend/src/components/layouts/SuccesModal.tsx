import React from 'react';

interface SuccesModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export const SuccesModal: React.FC<SuccesModalProps> = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        {/* Cambiamos border-success por el borde personalizado */}
        <div 
          className="modal-content text-white font-monospace" 
          style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0' }}
        >
          <div className="modal-body text-center py-4">
            {/* Cambiamos text-success por el color violeta */}
            <i 
              className="bi bi-check-circle-fill" 
              style={{ fontSize: '3rem', color: '#8e45e0' }}
            ></i>
            <h4 className="mt-3 fw-bold">¡Éxito!</h4>
            <p className="text-white-50">{message}</p>
            <button 
              className="btn mt-3 px-4 fw-bold text-white" 
              // Cambiamos btn-success por el color violeta
              style={{ backgroundColor: '#e22e2e', borderColor: '#e62020' }}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};