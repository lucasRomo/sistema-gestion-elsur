import React from 'react';

interface BarraAccionesTurnoProps {
  cajaAbierta: boolean;
  onVolver: () => void;
  onIniciarCaja: () => void;
  onConsultarArqueo: () => void;
  onCerrarTurno: () => void;
}

export const BarraAccionesTurno: React.FC<BarraAccionesTurnoProps> = ({
  cajaAbierta,
  onVolver,
  onIniciarCaja,
  onConsultarArqueo,
  onCerrarTurno
}) => {
  return (
    <div className="d-flex flex-wrap gap-3 justify-content-center w-100 mt-5 pt-2 px-2 m-0 pb-3">
      <button onClick={onVolver} className="btn btn-secondary px-4 py-2">Volver</button>

      <button className="btn btn-success d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={cajaAbierta} onClick={onIniciarCaja}>
        <span>Iniciar Caja del Día</span>
      </button>

      <button className="btn d-flex align-items-center justify-content-center fw-semibold text-center" style={{ backgroundColor: '#149bdf', color: '#ffffff', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={onConsultarArqueo}>
        <span>Consultar Arqueo</span>
      </button>

      <button className="btn btn-danger d-flex align-items-center justify-content-center fw-semibold text-center text-white" style={{ backgroundColor: '#daa32d', height: '42px', width: '220px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none' }} disabled={!cajaAbierta} onClick={onCerrarTurno}>
        <span>Cerrar Turno y Arqueo</span>
      </button>
    </div>
  );
};
