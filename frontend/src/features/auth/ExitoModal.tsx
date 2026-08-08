import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface ExitoModalProps {
  message: string;
  onAceptar: () => void;
}

export const ExitoModal: React.FC<ExitoModalProps> = ({ message, onAceptar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#8e45e0' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const messageColor = isDark ? '#a1a1aa' : '#475569';

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
        <div 
          className="modal-content p-4 text-center shadow-lg" 
          style={{ 
            backgroundColor: modalBg, 
            color: textColor, 
            border: `2px solid ${modalBorder}`, 
            borderRadius: '16px' 
          }}
        >
          <div className="mb-3">
            <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#8e45e0' }}></i>
          </div>

          <h4 className="fw-bold mb-3" style={{ color: textColor }}>
            ¡Usuario Registrado Correctamente!
          </h4>

          <p className="small mb-4 px-2" style={{ color: messageColor, lineHeight: '1.5' }}>
            {message}
          </p>

          <div className="d-flex justify-content-center">
            <button 
              type="button" 
              className="btn px-4 fw-semibold" 
              style={{ 
                backgroundColor: '#dc3545', 
                borderColor: '#dc3545', 
                borderRadius: '8px', 
                color: '#ffffff' 
              }} 
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