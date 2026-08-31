import React, { useState, useRef, useEffect } from 'react';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { useTheme } from '../../../Context/ThemeContext';

interface ModalRegistrarPagoProps {
  pedido: any;
  show: boolean;
  onClose: () => void;
  onConfirm: (tipoPago: string, monto: number, archivo: File | null) => Promise<void>;
}

export const ModalRegistrarPago: React.FC<ModalRegistrarPagoProps> = ({ pedido, onClose, onConfirm }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tipoPago, setTipoPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [errorCajaModal, setErrorCajaModal] = useState({ show: false, mensaje: "" });
  const [stockError, setStockError] = useState({ show: false, mensaje: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saldoPendiente = pedido.monto_total - pedido.monto_pago_adelantado;
  const [showConfirm, setShowConfirm] = useState(false);
  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const modalBorder = isDark ? '#334155' : '#cbd5e1';
  const resumenBg = isDark ? '#121214' : '#f1f5f9';
  const resumenText = isDark ? '#a1a1aa' : '#334155';
  const totalText = isDark ? '#ffffff' : '#0f172a';
  const labelClass = isDark ? 'text-light' : 'text-dark';
  const inputBg = isDark ? 'bg-dark' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-dark';
  const archivoBg = isDark ? '#121214' : '#f1f5f9';
  const botonAdjuntarBg = isDark ? '#1a1a1c' : '#f8fafc';
  const botonAdjuntarBorder = isDark ? '#38bdf8' : '#0284c7';
  const botonAdjuntarText = isDark ? '#38bdf8' : '#0284c7'; 

  // Verificación de Consumidor Final
  const esConsumidorFinal = 
    pedido?.cliente?.id_cliente === 1 || 
    pedido?.cliente?.idCliente === 1 || 
    pedido?.cliente?.razonSocial?.toLowerCase() === 'consumidor final';

  useEffect(() => {
    const verificarCaja = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/turnos/estado-caja');
        if (res.ok) {
          const text = await res.text(); 
          if (!text || text.trim() === "") {
            setCajaAbierta(false);
          } else {
            const turno = JSON.parse(text);
            setCajaAbierta(turno !== null);
          }
        } else {
          setCajaAbierta(false);
        }
      } catch (error) {
        console.error("Error al comprobar el estado de la caja:", error);
        setCajaAbierta(false);
      }
    };
    verificarCaja();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cajaAbierta === false) {
      setErrorCajaModal({
        show: true,
        mensaje: "La Caja No está Abierta. Por favor, inicie turno antes de continuar."
      });
      return;
    }

    const montoNum = Number(monto);
    if (montoNum <= 0 || montoNum > saldoPendiente) {
      setErrorCajaModal({
        show: true,
        mensaje: `El monto debe ser mayor a 0 y no puede superar el saldo pendiente ($${saldoPendiente})`
      });
      return;
    }
    
    try {
      await onConfirm(tipoPago, montoNum, archivo);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('stock')) {
        setStockError({
          show: true,
          mensaje: err.message
        });
      } else {
        setErrorCajaModal({
          show: true,
          mensaje: err.message || "Error al procesar el cobro."
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div 
  className="modal-content shadow-lg" 
  style={{ 
    backgroundColor: modalBg, 
    border: '1.5px solid #10b981', 
    borderRadius: '12px', 
    padding: '10px' 
  }}
>
          
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title" style={{ color: '#10b981', fontWeight: 'bold' }}>
              <i className="bi bi-currency-dollar me-2"></i>Registrar Pago - Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Tarjeta de Resumen en Tono Claro */}
              <div 
  className="d-flex justify-content-between mb-4 px-3 py-2 rounded align-items-center shadow-sm font-monospace" 
  style={{ backgroundColor: resumenBg, border: `1px solid ${modalBorder}`, fontSize: '0.9rem' }}
>
  <div style={{ color: resumenText, fontWeight: '600' }}>
    Total : <span className="fw-bold" style={{ color: totalText }}>${Number(pedido.monto_total).toFixed(2)}</span>
  </div>
  <div style={{ color: resumenText, fontWeight: '600' }}>
    Abonado : <span className="fw-bold" style={{ color: '#16a34a' }}>${Number(pedido.monto_pago_adelantado).toFixed(2)}</span>
  </div>
  <div style={{ color: resumenText, fontWeight: '600' }}>
    Saldo : <span className="fw-bold" style={{ color: '#dc2626' }}>${Number(saldoPendiente).toFixed(2)}</span>
  </div>
</div>

              {/* Selector Tipo de Pago */}
              <div className="mb-3">
                <label className={`form-label small ${labelClass} fw-bold mb-1`}>Tipo de Pago:</label>
                <select 
                  className={`form-select ${inputBg} ${inputText} border-secondary font-monospace`}
                  value={tipoPago}
                  onChange={(e) => {
                    setTipoPago(e.target.value);
                    if (e.target.value === 'EFECTIVO' || e.target.value === 'CUENTA_CORRIENTE') {
                      setArchivo(null);
                    }
                  }}
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="DEBITO">DÉBITO</option>
                </select>
              </div>

              {/* Input Monto */}
              <div className="mb-3">
                <label className={`form-label small ${labelClass} fw-bold mb-1`}>Monto a Ingresar ($):</label>
                <input 
                  type="number" 
                  step="0.01"
                  className={`form-control ${inputBg} ${inputText} border-secondary font-monospace`}
                  placeholder="0.00"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* Adjuntar Comprobante */}
              {tipoPago !== 'EFECTIVO' && tipoPago !== 'CUENTA_CORRIENTE' && (
                <div className="mb-4">
                 <label className={`form-label small ${labelClass} fw-bold mb-2 d-block`}>Comprobante de Respaldo:</label>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />

                  {!archivo ? (
                     <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
      style={{
        backgroundColor: botonAdjuntarBg,
        border: `1px solid ${botonAdjuntarBorder}`,
        color: botonAdjuntarText,
        borderRadius: '8px',
        fontSize: '0.95rem',
        fontWeight: '600',
        transition: 'all 0.2s ease'
      }}
    >
      <i className="bi bi-cloud-arrow-up fs-5"></i>
      <span>Vincular Comprobante (Opcional)</span>
    </button>
                  ) : (
                    <div 
  className="d-flex align-items-center justify-content-between p-2 rounded" 
  style={{ backgroundColor: archivoBg, border: `1px solid ${modalBorder}` }}
>
  <div className="d-flex align-items-center gap-2 overflow-hidden">
    <i className="bi bi-file-earmark-image text-primary fs-5"></i>
    <span className={`${labelClass} small text-truncate`} style={{ maxWidth: '280px' }}>
      {archivo.name}
    </span>
  </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger border-0" 
                        onClick={() => setArchivo(null)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-danger px-4" onClick={onClose}>Cancelar</button>
              <button 
                type="button" 
                className="btn btn-success px-4" 
                style={{ backgroundColor: '#16a34a', border: 'none' }}
                onClick={() => setShowConfirm(true)}
              >
                Procesar Cobro
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccesModal 
        show={errorCajaModal.show} 
        title="¡Error!"                           
        icon="bi-x-circle"          
        message={errorCajaModal.mensaje} 
        onClose={() => setErrorCajaModal({ show: false, mensaje: "" })} 
      />

      <SuccesModal 
        show={stockError.show} 
        title="Problema de Stock"
        icon="bi-exclamation-triangle-fill" 
        message={stockError.mensaje} 
        onClose={() => setStockError({ show: false, mensaje: "" })} 
      />

      {showConfirm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '340px' }}>
            <div 
  className={`modal-content ${isDark ? 'text-white' : 'text-dark'} text-center shadow-lg`} 
  style={{ 
    backgroundColor: modalBg, 
    border: '2px solid #7c2ae8', 
    borderRadius: '10px', 
    padding: '30px 22px'
  }}
>
              <div className="d-flex justify-content-center mb-4">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: '2px solid #7c2ae8'
                  }}
                >
                  <i 
                    className="bi bi-question-lg d-flex align-items-center justify-content-center" 
                    style={{ fontSize: '2rem', color: '#7c2ae8', width: '100%', height: '100%' }}
                  ></i>
                </div>
              </div>

              <h4 className="fw-bold mb-3" style={{ fontSize: '1.3rem', color: totalText }}>
  ¿Estás seguro?
</h4>

<p className="px-1 mb-4" style={{ color: resumenText, fontSize: '0.9rem', lineHeight: '1.4' }}>
  Se registrará el ingreso del cobro para este pedido.
</p>

              <div className="d-flex gap-2">
                <button 
                  type="button"
                  className="btn w-50 py-2 text-white fw-bold" 
                  style={{ backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '0.95rem' }}
                  onClick={() => setShowConfirm(false)}
                >
                  No, volver
                </button>
                <button 
                  type="button"
                  className="btn w-50 py-2 text-white fw-bold" 
                  style={{ backgroundColor: '#16a34a', border: 'none', borderRadius: '6px', fontSize: '0.95rem' }}
                  onClick={(e) => {
                    setShowConfirm(false);
                    handleSubmit(e);
                  }}
                >
                  Sí, ingresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};