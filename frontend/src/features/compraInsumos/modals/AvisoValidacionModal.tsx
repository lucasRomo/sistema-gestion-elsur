import React from 'react';

interface AvisoValidacionModalProps {
  mensaje: string;
  onClose: () => void;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
}

export const AvisoValidacionModal: React.FC<AvisoValidacionModalProps> = ({
  mensaje,
  onClose,
  cardBg,
  textColor
}) => {
  return (
    <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1100 }} role="dialog">
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
        <div 
          className={`modal-content ${textColor} font-monospace p-4 text-center`} 
          style={{ 
            backgroundColor: cardBg, 
            border: '2px solid #ffc107', /* <--- Borde amarillo del modal */
            borderRadius: '20px' 
          }}
        >
          <div className="d-flex flex-column align-items-center gap-3">
            {/* Ícono circular de advertencia */}
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '60px',
                height: '60px',
                border: '2px solid #ffc107',
                color: '#ffc107',
                fontSize: '1.8rem'
              }}
            >
              <i className="bi bi-exclamation-lg"></i>
            </div>

            {/* Título y Mensaje */}
            <h4 className="fw-bold m-0 mt-2">Algo ha ido Mal</h4>
            <p className="m-0 text-muted fs-6" style={{ lineHeight: '1.5' }}>
              {mensaje}
            </p>

            {/* Botón de cierre */}
            <button 
              type="button" 
              className="btn btn-secondary w-100 fw-bold mt-3 py-2" 
              style={{ borderRadius: '10px' }}
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