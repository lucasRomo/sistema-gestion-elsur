// src/components/ExitoModal.tsx
import React from 'react';

interface ExitoModalProps {
  onAceptar: () => void;
}

export const ExitoModal: React.FC<ExitoModalProps> = ({ onAceptar }) => {
  return (
    <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
      <div className="modal-dialog w-100 p-3" style={{ maxWidth: '420px' }}>
        <div className="modal-content border-0 p-4 text-center text-white" style={{ backgroundColor: '#1e1e22', borderRadius: '12px', borderLeft: '4px solid #a855f7', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <h4 className="fw-bold mb-3">¡Usuario Registrado Correctamente!</h4>
          <p className="text-secondary small mb-4">
            Su Usuario ha sido Registrado. Una vez Activado en el panel de Gestión de Usuarios podrá Ingresar al Sistema con sus Credenciales.
          </p>
          <button className="btn btn-danger w-100 py-2" style={{ backgroundColor: '#a13b3b', border: 'none', borderRadius: '8px' }} onClick={onAceptar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};