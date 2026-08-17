import React, { useState } from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  total: number;
  onConfirmarPago: (datosPago: {
    tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO';
    comprobanteFile?: File | null;
  }) => void;
}

export const ModalElegirMetodoPago: React.FC<Props> = ({
  show,
  onClose,
  total,
  onConfirmarPago
}) => {
  const [tipoPago, setTipoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO'>('EFECTIVO');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfirmarPago({
      tipoPago,
      comprobanteFile
    });
  };

  return (
    <div className="modal show d-block font-monospace" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px'}}>
        <div className="modal-content text-white" style={{ backgroundColor: '#1b1b1b', border: '1px solid #2d323e', borderRadius: '12px' }}>
          
          {/* HEADER */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-5" style={{ color: '#a855f7' }}>
              <i className="bi bi-currency-dollar fs-4"></i> Método de Pago
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              style={{ opacity: 0.8 }}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 pt-3 pb-2">
              
              {/* TARJETA MONTO TOTAL */}
              <div 
                className="p-3 mb-3 text-center rounded d-flex justify-content-between align-items-center" 
                style={{ backgroundColor: '#1b1b1b', border: '1px solid #2a313d' }}
              >
                <span className="text-light small fw-semibold">Total a Cobrar :</span>
                <span className="fw-bold fs-5" style={{ color: '#22c55e' }}>${total.toFixed(2)}</span>
              </div>

              {/* SELECTOR TIPO DE PAGO */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-light mb-1">Tipo de Pago:</label>
                <select
                  className="form-select text-white font-monospace"
                  style={{
                    backgroundColor: '#1b1b1b',
                    borderColor: '#0284c7',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 1px #0284c7',
                    padding: '10px 14px'
                  }}
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value as any)}
                >
                  <option value="EFECTIVO" style={{ backgroundColor: '#16181d' }}>EFECTIVO</option>
                  <option value="TRANSFERENCIA" style={{ backgroundColor: '#16181d' }}>TRANSFERENCIA</option>
                  <option value="DEBITO" style={{ backgroundColor: '#16181d' }}>DÉBITO / CRÉDITO</option>
                </select>
              </div>

              {/* VINCULAR COMPROBANTE (SOLO PARA TRANSFERENCIA) */}
              {tipoPago === 'TRANSFERENCIA' && (
                <div className="mb-3">
                  <label className="form-label fw-bold small text-light mb-1">Comprobante de Respaldo:</label>
                  <div className="position-relative">
                    <input
                      type="file"
                      id="comprobanteInput"
                      className="d-none"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="comprobanteInput"
                      className="btn w-100 d-flex justify-content-center align-items-center gap-2 font-monospace"
                      style={{
                        backgroundColor: '#16181d',
                        border: '1px solid #0891b2',
                        color: '#06b6d4',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-5"></i>
                      <span>
                        {comprobanteFile ? comprobanteFile.name : 'Vincular Comprobante (Opcional)'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER BOTONES */}
            <div className="modal-footer border-0 px-4 pb-4 pt-2 d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn text-white fw-bold px-4" 
                style={{ backgroundColor: '#ef4444', borderRadius: '8px', border: 'none' }}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn text-white fw-bold px-4" 
                style={{ backgroundColor: '#10b981', borderRadius: '8px', border: 'none' }}
              >
                Procesar Cobro
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};