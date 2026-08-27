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
      <style>{`
        .im-date-input {
          width: 110px;
          font-size: 0.78rem;
        }
        @media (min-width: 992px) {
          .im-date-input {
            width: 125px;
            font-size: 0.85rem;
          }
        }
        .im-fecha-analizar-wrap {
          width: 100%;
        }
        @media (min-width: 992px) {
          .im-fecha-analizar-wrap {
            width: auto;
          }
        }
        @media (max-width: 480px) {
          .im-fecha-row {
            width: 100%;
            justify-content: center;
          }
          .im-btn-analizar {
            width: 100%;
            margin-left: 0 !important;
          }
        }
      `}</style>

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
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 im-fecha-analizar-wrap">
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 im-fecha-row">
          <div className="d-flex align-items-center px-3 py-2 rounded-3 im-surface">
            <input
              type="date"
              className="form-control form-control-sm bg-transparent border-0 shadow-none p-0 text-white im-date-input"
              value={fechaDesdeInput}
              onChange={(e) => setFechaDesdeInput(e.target.value)}
            />
          </div>

          <span className="text-secondary fw-bold px-1">-</span>

          <div className="d-flex align-items-center px-3 py-2 rounded-3 im-surface">
            <input
              type="date"
              className="form-control form-control-sm bg-transparent border-0 shadow-none p-0 text-white im-date-input"
              value={fechaHastaInput}
              onChange={(e) => setFechaHastaInput(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm fw-semibold px-3 rounded-2 ms-1 im-btn-analizar"
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