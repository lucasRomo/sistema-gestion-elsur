// src/components/ExitoModal.tsx
import React from 'react';

interface ExitoModalProps {
  onAceptar: () => void;
  // Hacemos que el mensaje sea opcional por si quieres usarlo en otros lados
  message?: string; 
}

export const ExitoModal: React.FC<ExitoModalProps> = ({ 
  onAceptar, 
  message = "Su Usuario ha sido Registrado. Una vez Activado en el panel de Gestión de Usuarios podrá Ingresar al Sistema con sus Credenciales." 
}) => {
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div 
          className="modal-content text-white font-monospace" 
          style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0' }}
        >
          <div className="modal-body text-center py-4">
            <i 
              className="bi bi-check-circle-fill" 
              style={{ fontSize: '3rem', color: '#8e45e0' }}
            ></i>
            <h4 className="mt-3 fw-bold">¡Usuario Registrado Correctamente!</h4>
            <p className="text-white-50 px-3">{message}</p>
            <button 
              className="btn mt-3 px-4 fw-bold text-white" 
              style={{ backgroundColor: '#e22e2e', borderColor: '#e62020' }}
              onClick={onAceptar}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};