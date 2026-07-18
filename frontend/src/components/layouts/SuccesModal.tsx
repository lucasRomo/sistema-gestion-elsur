import React from 'react';

interface SuccesModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
  title?: string;
  icon?: string;  
}

export const SuccesModal: React.FC<SuccesModalProps> = ({ 
  show, 
  message, 
  onClose, 
  title = "¡Éxito!",             
  icon = "bi-check-circle-fill" 
}) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content text-white font-monospace"
          style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0' }}
        >
          <div className="modal-body text-center py-4">
            
            {/* ➔ CAMBIO 1: Ahora usa la prop 'icon' dinámica en vez de la clase fija de éxito */}
            <i
              className={`bi ${icon}`}
              style={{ fontSize: '3rem', color: '#8e45e0' }}
            ></i>
            
            {/* ➔ CAMBIO 2: Ahora usa la prop 'title' dinámica en vez de '¡Éxito!' fijo */}
            <h4 className="mt-3 fw-bold">{title}</h4>
            
            <p className="text-white-50">{message}</p>
            <button
              className="btn mt-3 px-4 fw-bold text-white"
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