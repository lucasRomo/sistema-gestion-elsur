import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!show) return null;

  // Estilos adaptativos según el tema activo
  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalText = isDark ? '#ffffff' : '#18181b';
  const descColor = isDark ? '#a1a1aa' : '#64748b'; // Texto secundario visible y elegante en ambos modos
  const modalBorder = isDark ? '#8e45e0' : '#cbd5e1';

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content font-monospace shadow-lg"
          style={{ backgroundColor: modalBg, color: modalText, border: `1px solid ${modalBorder}` }}
        >
          <div className="modal-body text-center py-4">
            
            <i
              className={`bi ${icon}`}
              style={{ fontSize: '3rem', color: '#8e45e0' }}
            ></i>
            
            <h4 className="mt-3 fw-bold" style={{ color: modalText }}>{title}</h4>
            
            <p style={{ color: descColor }} className="mb-3">{message}</p>
            
            <button
              className="btn mt-3 px-4 fw-bold"
              style={{ backgroundColor: '#e22e2e', borderColor: '#e62020', color: '#ffffff' }}
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