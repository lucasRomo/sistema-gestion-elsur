import React, { useState } from 'react';

interface ModalRegistrarPagoProps {
  pedido: any;
  onClose: () => void;
  onConfirm: (tipoPago: string, monto: number, urlComprobante: string) => void;
}

export const ModalRegistrarPago: React.FC<ModalRegistrarPagoProps> = ({ pedido, onClose, onConfirm }) => {
  const [tipoPago, setTipoPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');
  const [urlComprobante, setUrlComprobante] = useState('');

  const saldoPendiente = pedido.monto_total - pedido.monto_pago_adelantado;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(monto);
    if (montoNum <= 0 || montoNum > saldoPendiente) {
      alert(`El monto debe ser mayor a 0 y no puede superar el saldo pendiente ($${saldoPendiente})`);
      return;
    }
    onConfirm(tipoPago, montoNum, urlComprobante);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-success">
              <i className="bi bi-currency-dollar me-2"></i>Registrar Pago / Seña - Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3 font-monospace small text-secondary">
                <div className="col-6">Total Pedido: <span className="text-white">${pedido.monto_total}</span></div>
                <div className="col-6">Ya Abonado: <span className="text-info">${pedido.monto_pago_adelantado}</span></div>
                <div className="col-12 mt-1 fs-6 fw-bold">Saldo Restante: <span className="text-danger">${saldoPendiente}</span></div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary fw-bold">Tipo de Pago:</label>
                <select 
                  className="form-select bg-black text-white border-secondary"
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="DEBITO">DÉBITO</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary fw-bold">Monto a Ingresar ($):</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control bg-black text-white border-secondary fs-5 text-success fw-bold"
                  placeholder="0.00"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success">Procesar Cobro</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};