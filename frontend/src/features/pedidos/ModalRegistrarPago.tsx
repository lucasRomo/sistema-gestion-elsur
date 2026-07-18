import React, { useState, useRef, useEffect } from 'react';
import { SuccesModal } from '../../components/layouts/SuccesModal';

interface ModalRegistrarPagoProps {
  pedido: any;
  show: boolean;
  onClose: () => void;
  onConfirm: (tipoPago: string, monto: number, archivo: File | null) => Promise<void>;
}

export const ModalRegistrarPago: React.FC<ModalRegistrarPagoProps> = ({ pedido, onClose, onConfirm }) => {
  const [tipoPago, setTipoPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null); // Estado para el archivo del comprobante
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [errorCajaModal, setErrorCajaModal] = useState({ show: false, mensaje: "" });
  const [stockError, setStockError] = useState({ show: false, mensaje: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saldoPendiente = pedido.monto_total - pedido.monto_pago_adelantado;
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
  const verificarCaja = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/turnos/estado-caja');
      
      if (res.ok) {
        // ➔ MODIFICACIÓN: Leer el texto de la respuesta primero
        const text = await res.text(); 
        
        // Si el cuerpo está vacío, asumimos que no hay un turno activo (null)
        if (!text || text.trim() === "") {
          setCajaAbierta(false);
        } else {
          // Si tiene contenido, recién ahí lo parseamos como JSON seguro
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
      onClose(); // Si sale bien, cerramos directo
    } catch (err: any) {
      // ➔ AQUÍ CAPTURAMOS EL ERROR: Si el backend/padre avisa que es un tema de Stock
      if (err.message && err.message.toLowerCase().includes('stock')) {
        setStockError({
          show: true,
          mensaje: err.message // "No hay stock suficiente para los artículos del pedido"
        });
      } else {
        // Errores comunes van al diseño estándar
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
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ backgroundColor: '#1a1a1c', border: '1px solid #4d099b', borderRadius: '12px', padding: '10px' }}>
          
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title" style={{ color: '#8e45e0', fontWeight: 'bold' }}>
              <i className="bi bi-currency-dollar me-2"></i>Registrar Pago - Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="d-flex justify-content-between mb-4 px-2 py-2 rounded" style={{ backgroundColor: '#121214', fontSize: '0.9rem' }}>
                <div className="text-white">Total : <span className="text-white">${Number(pedido.monto_total).toFixed(2)}</span></div>
                <div className="text-white">Abonado : <span className="text-success">${Number(pedido.monto_pago_adelantado).toFixed(2)}</span></div>
                <div className="text-white">Saldo : <span className="text-danger">${Number(saldoPendiente).toFixed(2)}</span></div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-white">Tipo de Pago:</label>
                <select 
                  className="form-control" 
                  style={{ backgroundColor: '#121214', color: '#fff', border: '1px solid #3f3f46' }}
                  value={tipoPago}
                  onChange={(e) => {
                    setTipoPago(e.target.value);
                    if (e.target.value === 'EFECTIVO') setArchivo(null); // Reseteamos si vuelve a Efectivo
                  }}
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="DEBITO">DÉBITO</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small text-white">Monto a Ingresar ($):</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control"
                  style={{ backgroundColor: '#121214', color: '#fff', border: '1px solid #3f3f46' }}
                  placeholder="0.00"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              {/* INPUT DINÁMICO PARA SUBIR EL SEGUNDO COMPROBANTE */}
             {tipoPago !== 'EFECTIVO' && (
                <div className="mb-4">
                  <label className="form-label small text-white mb-2 d-block">Comprobante de Respaldo:</label>
                  
                  {/* Input real oculto */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />

                  {!archivo ? (
                    /* Botón personalizado estilo Cian */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #00b4d8', // Borde cian fino
                        color: '#00b4d8',             // Texto e icono cian
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 180, 216, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-5"></i>
                      <span>Vincular Comprobante (Opcional)</span>
                    </button>
                  ) : (
                    /* Feedback cuando se sube el archivo */
                    <div 
                      className="d-flex align-items-center justify-content-between p-2 rounded" 
                      style={{ backgroundColor: '#121214', border: '1px solid #3f3f46' }}
                    >
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <i className="bi bi-file-earmark-image text-info fs-5"></i>
                        <span className="text-white small text-truncate" style={{ maxWidth: '280px' }}>
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
                style={{ backgroundColor: '#15803d', border: 'none' }}
                onClick={() => setShowConfirm(true)}
              >
                Procesar Cobro
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL 1: Error de Caja o Importes (Carmesí/Violeta original) */}
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
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '340px' }}>
            <div 
              className="modal-content text-white text-center" 
              style={{ 
                backgroundColor: '#161517', 
                border: '2px solid #7c2ae8', 
                borderRadius: '10px', 
                padding: '30px 22px',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
              }}
            >
              {/* Círculo con signo de interrogación morado */}
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

              {/* Título */}
              <h4 className="fw-bold mb-3" style={{ fontSize: '1.3rem', color: '#ffffff' }}>
                ¿Estás seguro?
              </h4>
              
              {/* Mensaje */}
              <p className="px-1 mb-4" style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4' }}>
                Se registrará el ingreso del cobro para este pedido.
              </p>

              {/* Acciones: Volver o Confirmar */}
              <div className="d-flex gap-2">
                <button 
                  type="button"
                  className="btn w-50 py-2 text-white fw-bold" 
                  style={{ backgroundColor: '#a81805', border: 'none', borderRadius: '6px', fontSize: '0.95rem' }}
                  onClick={() => setShowConfirm(false)}
                >
                  No, volver
                </button>
                <button 
                  type="button"
                  className="btn w-50 py-2 text-white fw-bold" 
                  style={{ backgroundColor: '#15803d', border: 'none', borderRadius: '6px', fontSize: '0.95rem' }}
                  onClick={(e) => {
                    setShowConfirm(false); // Cierra este modal de confirmación
                    handleSubmit(e);       // Ejecuta el flujo de guardado real
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