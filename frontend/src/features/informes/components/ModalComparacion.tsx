import React from 'react';
import type { TipoComparacion, InformeComparacion, PeriodoRango, ComparacionDataState } from '../types/informeTypes';

interface ModalComparacionProps {
  modalComparacionAbierto: boolean;
  informeComparacion: InformeComparacion | null;
  tipoComparacion: TipoComparacion | null;
  modalFechaDesdeInput: string;
  modalFechaHastaInput: string;
  modalFechaDesdeCompInput: string;
  modalFechaHastaCompInput: string;
  comparacionData: ComparacionDataState | null;
  setModalFechaDesdeInput: (fecha: string) => void;
  setModalFechaHastaInput: (fecha: string) => void;
  setModalFechaDesdeCompInput: (fecha: string) => void;
  setModalFechaHastaCompInput: (fecha: string) => void;
  seleccionarTipoComparacion: (tipo: TipoComparacion) => void;
  handleAnalizarComparacionModal: () => void;
  cerrarModalComparacion: () => void;
  obtenerNombreInforme: (informe: InformeComparacion | null) => string;
  esMismoDia?: boolean;
  renderGraficoEspecifico?: (informe: InformeComparacion, data: any, esAnterior?: boolean) => React.ReactNode;
}

export const ModalComparacion: React.FC<ModalComparacionProps> = ({
  modalComparacionAbierto,
  informeComparacion,
  tipoComparacion,
  modalFechaDesdeInput,
  modalFechaHastaInput,
  modalFechaDesdeCompInput,
  modalFechaHastaCompInput,
  comparacionData,
  setModalFechaDesdeInput,
  setModalFechaHastaInput,
  setModalFechaDesdeCompInput,
  setModalFechaHastaCompInput,
  seleccionarTipoComparacion,
  handleAnalizarComparacionModal,
  cerrarModalComparacion,
  obtenerNombreInforme,
  esMismoDia,
  renderGraficoEspecifico,
}) => {
  if (!modalComparacionAbierto || !informeComparacion) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <style>{`
        @media (max-width: 480px) {
          .im-modal-comp-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }
          .im-modal-comp-body {
            padding: 1rem !important;
          }
          .im-modal-comp-header {
            padding: 1rem !important;
          }
          .im-date-row {
            flex-wrap: wrap;
          }
          .im-date-row input[type="date"] {
            min-width: 0;
            flex: 1 1 100px;
            font-size: 0.78rem;
            padding: 0.3rem 0.4rem;
          }
          .im-comp-btn {
            font-size: 0.75rem;
            padding: 0.4rem 0.6rem !important;
          }
        }
      `}</style>
      <div className="modal-dialog modal-xl modal-dialog-centered im-modal-comp-dialog">
        <div className="modal-content im-surface text-white border border-secondary shadow-lg rounded-4">

          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3 im-modal-comp-header">
            <div>
              <h5 className="modal-title fw-bold font-monospace d-flex align-items-center gap-2">
                <i className="bi bi-arrow-left-right text-info-custom"></i>
                Comparativa: {obtenerNombreInforme(informeComparacion)}
              </h5>
              <p className="text-secondary small mb-0">
                Seleccioná el modo de comparación para confrontar dos períodos de tiempo.
              </p>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={cerrarModalComparacion}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 im-modal-comp-body">

            {/* Botones de Tipo de Comparación */}
<div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
  {([
    { id: 'dia', label: 'Día Anterior' },
    { id: 'semana', label: 'Semana Anterior' },
    { id: 'mes', label: 'Mes Anterior' },
    { id: 'personalizado', label: 'Personalizado' },
  ] as const).map((item) => {
    const isSelected = tipoComparacion === item.id;
    return (
      <button
        key={item.id}
        type="button"
        className={`btn btn-sm px-3 py-2 fw-semibold im-comp-btn ${
          isSelected ? 'text-white' : 'btn-outline-secondary text-light'
        }`}
        style={
          isSelected
            ? { backgroundColor: '#149bdf', borderColor: '#149bdf' }
            : {}
        }
        onClick={() => seleccionarTipoComparacion(item.id)}
      >
        {item.label}
      </button>
    );
  })}
</div>

            {/* Configuración de Fechas de Comparación */}
            {tipoComparacion && (
              <div className="p-3 mb-4 rounded-3 border border-secondary border-opacity-25 im-surface-head">
                <div className="row g-3 align-items-center">

                  {/* Período Actual */}
                  <div className="col-12 col-md-5">
                    <label className="form-label small text-info-custom fw-bold mb-1">Período Actual</label>
                    <div className="d-flex align-items-center gap-2 im-date-row">
                      <input
                        type="date"
                        className="form-control form-control-sm bg-dark text-white border-secondary"
                        value={modalFechaDesdeInput}
                        onChange={(e) => setModalFechaDesdeInput(e.target.value)}
                      />
                      <span className="text-secondary">-</span>
                      <input
                        type="date"
                        className="form-control form-control-sm bg-dark text-white border-secondary"
                        value={modalFechaHastaInput}
                        onChange={(e) => setModalFechaHastaInput(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Separador vs */}
                  <div className="col-12 col-md-2 text-center">
                    <span className="fw-bold text-secondary font-monospace">VS</span>
                  </div>

                  {/* Período Anterior */}
                  <div className="col-12 col-md-5">
                    <label className="form-label small text-secondary fw-bold mb-1">Período a Comparar</label>
                    <div className="d-flex align-items-center gap-2 im-date-row">
                      <input
                        type="date"
                        className="form-control form-control-sm bg-dark text-white border-secondary"
                        value={modalFechaDesdeCompInput}
                        onChange={(e) => setModalFechaDesdeCompInput(e.target.value)}
                      />
                      <span className="text-secondary">-</span>
                      <input
                        type="date"
                        className="form-control form-control-sm bg-dark text-white border-secondary"
                        value={modalFechaHastaCompInput}
                        onChange={(e) => setModalFechaHastaCompInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-end mt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary px-4 fw-bold im-comp-btn"
                    onClick={handleAnalizarComparacionModal}
                  >
                    Recalcular Comparativa
                  </button>
                </div>
              </div>
            )}

            {/* Vista Gráfica Comparativa Lado a Lado */}
            {comparacionData && (
              <div className="row g-4">

                {/* Gráfico Actual */}
                <div className="col-12 col-lg-6">
                  <div className="p-3 rounded-3 border border-info  border-opacity-25 h-100">
                    <h6 className="fw-bold text-info-custom mb-3">
                      Período Actual ({comparacionData.periodoActual.desde} a {comparacionData.periodoActual.hasta})
                    </h6>
                    <div style={{ height: '320px', width: '100%' }}>
                      {renderGraficoEspecifico && renderGraficoEspecifico(informeComparacion, comparacionData.actual, false)}
                    </div>
                  </div>
                </div>

                {/* Gráfico Anterior */}
                <div className="col-12 col-lg-6">
                  <div className="p-3 rounded-3 border border-secondary border-opacity-25 h-100">
                    <h6 className="fw-bold text-secondary mb-3">
                      Período Anterior ({comparacionData.periodoAnterior.desde} a {comparacionData.periodoAnterior.hasta})
                    </h6>
                    <div style={{ height: '320px', width: '100%' }}>
                      {renderGraficoEspecifico && renderGraficoEspecifico(informeComparacion, comparacionData.anterior, true)}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm px-4"
              onClick={cerrarModalComparacion}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};