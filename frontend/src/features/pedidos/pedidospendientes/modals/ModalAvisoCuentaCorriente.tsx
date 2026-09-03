import React from 'react';

interface Props {
  show: boolean;
  isDarkMode: boolean;
  onRevisarCuenta: () => void;
  onAbonarPedido: () => void;
  onClose: () => void;
}

export const ModalAvisoCuentaCorriente: React.FC<Props> = ({
  show,
  isDarkMode,
  onRevisarCuenta,
  onAbonarPedido,
  onClose
}) => {
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div 
          className="modal-content text-white text-center p-4" 
          style={{ 
            backgroundColor: '#1a1a1c', 
            border: '2px solid #7c2ae8', 
            borderRadius: '12px' 
          }}
        >
          <div className="d-flex justify-content-center mb-3">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(124, 42, 232, 0.15)', border: '2px solid #7c2ae8' }}
            >
              <i className="bi bi-info-circle-fill fs-3" style={{ color: '#7c2ae8' }}></i>
            </div>
          </div>

          <h5 className="fw-bold mb-3" style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}>
            Aviso de Cuenta Corriente
          </h5>

          <p className="mb-4" style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.4' }}>
            El pago de este pedido está Vinculado a la cuenta corriente del cliente.
          </p>

          <div className="d-flex flex-column gap-2">
            <button 
              type="button" 
              className="btn py-2 fw-bold"
              style={{ backgroundColor: '#2563eb', color:'#ffffff', border: 'none', borderRadius: '6px' }}
              onClick={onRevisarCuenta}
            >
              <i className="bi bi-wallet2 me-2"></i> Revisar Cuenta Corriente
            </button>

            <button 
              type="button" 
              className="btn py-2 fw-bold"
              style={{ backgroundColor: '#15803d', color:'#ffffff', border: 'none', borderRadius: '6px' }}
              onClick={onAbonarPedido}
            >
              <i className="bi bi-cash-coin me-2"></i> Abonar Pedido
            </button>

            <button 
              type="button" 
              className="btn py-2 fw-bold"
              style={{ backgroundColor: '#dc2626', color:'#ffffff', border: 'none', borderRadius: '6px' }}
              onClick={onClose}
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};