import React, { useState } from 'react';

interface Props {
  data: {
    show: boolean;
    pedido: any;
    nuevoEstado: string;
    observaciones: string;
    saldoPendiente: number;
    deudaPrevia: number;
    deudaTotal: number;
    limiteCredito: number;
  };
  onClose: () => void;
  onActualizarYEntregar: (nuevoLimite: number) => Promise<void>;
  onAutorizarUnaVez: () => void;
  onRegistrarCobro: (pedido: any) => void;
}

export const ModalAdvertenciaDeuda: React.FC<Props> = ({
  data,
  onClose,
  onActualizarYEntregar,
  onAutorizarUnaVez,
  onRegistrarCobro
}) => {
  const [nuevoLimiteInput, setNuevoLimiteInput] = useState<string>(data.deudaTotal.toString());
  const [cargando, setCargando] = useState(false);

  if (!data.show) return null;

  const handleGuardar = async () => {
    const num = Number(nuevoLimiteInput);
    if (isNaN(num) || num < 0) return alert("Ingrese un monto válido.");
    setCargando(true);
    await onActualizarYEntregar(num);
    setCargando(false);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content text-white p-4" style={{ backgroundColor: '#1a1a1c', border: '2px solid #f59e0b', borderRadius: '12px' }}>
          <div className="text-center mb-3">
            <h5 className="fw-bold">{data.limiteCredito === 0 ? 'Cliente sin Límite de Crédito' : 'Límite de Crédito Superado'}</h5>
          </div>

          <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#121214', border: '1px solid #27272a', fontSize: '0.9rem' }}>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Pedido #:</span>
              <span className="fw-bold text-white">{data.pedido?.id_pedido}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Deuda Previa:</span>
              <span>${data.deudaPrevia.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Saldo Pendiente:</span>
              <span>${data.saldoPendiente.toFixed(2)}</span>
            </div>
            <hr className="my-2 border-secondary" />
            <div className="d-flex justify-content-between mb-1">
              <span className="text-white fw-bold">Deuda Total Proyectada:</span>
              <span className="fw-bold text-warning">${data.deudaTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#232326' }}>
            <label className="form-label text-warning small fw-bold mb-1">Actualizar Límite de Crédito ($):</label>
            <input 
              type="number" 
              className="form-control bg-dark text-white border-secondary font-monospace"
              value={nuevoLimiteInput}
              onChange={(e) => setNuevoLimiteInput(e.target.value)}
            />
          </div>

          <div className="d-flex flex-column gap-2">
            <button className="btn btn-primary fw-bold" disabled={cargando} onClick={handleGuardar}>
              {cargando ? 'Guardando...' : 'Actualizar Límite y Entregar'}
            </button>
            <button className="btn btn-warning fw-bold text-white" onClick={onAutorizarUnaVez}>
              Autorizar Solo Esta Vez
            </button>
            <button className="btn btn-success fw-bold" onClick={() => onRegistrarCobro(data.pedido)}>
              Registrar Cobro Ahora
            </button>
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};