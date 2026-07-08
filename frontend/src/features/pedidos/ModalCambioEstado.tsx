import React, { useState } from 'react';

interface ModalCambioEstadoProps {
  pedido: any;
  nuevoEstado: string;
  onClose: () => void;
  onConfirm: (observaciones: string) => void;
}

export const ModalCambioEstado: React.FC<ModalCambioEstadoProps> = ({ pedido, nuevoEstado, onClose, onConfirm }) => {
  const [obs, setObs] = useState('');

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-info">Auditoría de Cambio de Estado</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Vas a cambiar el pedido <strong>#{pedido.id_pedido}</strong> del estado <span className="text-warning">{pedido.estado}</span> a <span className="text-success">{nuevoEstado}</span>.</p>
            <div className="mb-3">
              <label className="form-label small text-secondary fw-bold">Motivo / Observaciones del Cambio:</label>
              <textarea 
                className="form-control bg-black text-white border-secondary" 
                rows={3} 
                value={obs} 
                onChange={(e) => setObs(e.target.value)}
                placeholder="Escribí acá qué pasó con el trabajo o por qué cambió el estado..."
              />
            </div>
          </div>
          <div className="modal-footer border-secondary">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-success" onClick={() => onConfirm(obs)}>Guardar Historial</button>
          </div>
        </div>
      </div>
    </div>
  );
};