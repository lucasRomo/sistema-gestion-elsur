import React from 'react';

interface InformesHeaderProps {
  fechaDesdeInput: string;
  fechaHastaInput: string;
  setFechaDesdeInput: (fecha: string) => void;
  setFechaHastaInput: (fecha: string) => void;
  handleSeleccionarHoy: () => void;
  handleSeleccionarEstaSemana: () => void;
  handleSeleccionarEsteMes: () => void;
  handleAnalizar: () => void;
}

export const InformesHeader: React.FC<InformesHeaderProps> = ({
  fechaDesdeInput,
  fechaHastaInput,
  setFechaDesdeInput,
  setFechaHastaInput,
  handleSeleccionarHoy,
  handleSeleccionarEstaSemana,
  handleSeleccionarEsteMes,
  handleAnalizar
}) => {
  return (
    <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3 p-3 mb-4 rounded-3 im-surface-head">
      {/* 1. IZQUIERDA: Botones de Período (Día, Semana, Mes) */}
      <div className="btn-group btn-group-sm" role="group" aria-label="Selección rápida de período">
        <button 
          type="button" 
          className="btn btn-outline-secondary border-secondary text-light fw-medium px-3 im-btn-period"
          onClick={handleSeleccionarHoy}
        >
          Hoy
        </button>
        <button 
          type="button" 
          className="btn btn-outline-secondary border-secondary text-light fw-medium px-3 im-btn-period"
          onClick={handleSeleccionarEstaSemana}
        >
          Semana
        </button>
        <button 
          type="button" 
          className="btn btn-outline-secondary border-secondary text-light fw-medium px-3 im-btn-period"
          onClick={handleSeleccionarEsteMes}
        >
          Mes
        </button>
      </div>

      {/* 2. CENTRO: Título */}
      <h2 
        className="h5 mb-0 text-white font-monospace fw-bold tracking-wide text-center position-relative"
        style={{ letterSpacing: '0.5px', fontSize: '2rem' }}
      >
        Métricas e Informes
      </h2>

      {/* 3. DERECHA: Fechas independientes + Botón Analizar */}
      <div className="d-flex align-items-center gap-2">
        <div className="d-flex align-items-center px-3 py-2 rounded-3 im-surface">
          <input
            type="date"
            className="form-control form-control-sm bg-transparent border-0 shadow-none p-0 text-white"
            value={fechaDesdeInput}
            onChange={(e) => setFechaDesdeInput(e.target.value)}
            style={{ width: '125px', fontSize: '0.85rem' }}
          />
        </div>

        <span className="text-secondary fw-bold px-1">-</span>

        <div className="d-flex align-items-center px-3 py-2 rounded-3 im-surface">
          <input
            type="date"
            className="form-control form-control-sm bg-transparent border-0 shadow-none p-0 text-white"
            value={fechaHastaInput}
            onChange={(e) => setFechaHastaInput(e.target.value)}
            style={{ width: '125px', fontSize: '0.85rem' }}
          />
        </div>

        <button
          type="button"
          className="btn btn-sm fw-semibold px-3 rounded-2 ms-1"
          onClick={handleAnalizar}
          style={{
            backgroundColor: '#6f42c1',
            borderColor: '#6f42c1',
            color: '#ffffff',
            fontSize: '0.85rem',
            paddingTop: '0.35rem',
            paddingBottom: '0.35rem'
          }}
        >
          Analizar
        </button>
      </div>
    </div>
  );
};