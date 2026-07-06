import React from 'react';

interface LoginFeedbackModalProps {
  mostrar: boolean;
  tipo: 'exito' | 'error' | null;
  mensaje: string;
  onAceptar: () => void;
}

export const LoginFeedbackModal: React.FC<LoginFeedbackModalProps> = ({ mostrar, tipo, mensaje, onAceptar }) => {
  if (!mostrar || !tipo) return null;

  const esExito = tipo === 'exito';

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '380px' }}>
        <div 
          className="modal-content p-4 text-white text-center" 
          style={{ backgroundColor: '#18181b', border: '2px solid #8e45e0' }} // Borde violeta fijo
        >
          <div className="mb-2">
            {esExito ? (
              <i className="bi bi-check-circle-fill fs-1" style={{ color: '#8e45e0' }}></i>
            ) : (
              <i className="bi bi-x-circle-fill fs-1" style={{ color: '#8e45e0' }}></i>
            )}
          </div>
          
          <h5 className="fw-bold mb-2">
            {esExito ? '¡Bienvenido!' : 'Error de Inicio'}
          </h5>
          
          <p className="small text-secondary mb-4">{mensaje}</p>
          
          <div className="d-flex justify-content-center">
            <button 
              className="btn btn-sm px-4 fw-bold text-white" 
              style={{ backgroundColor: '#8e45e0', borderColor: '#8e45e0' }} // Botón violeta
              onClick={onAceptar}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};