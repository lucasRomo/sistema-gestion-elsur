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
  esMismoDia, // <-- Recibir esMismoDia
  renderGraficoEspecifico,
}) => {
  if (!modalComparacionAbierto || !informeComparacion) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content im-surface text-white border border-secondary shadow-lg rounded-4">
          
          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold font-monospace d-flex align-items-center gap-2">
                <i className="bi bi-arrow-left-right text-info"></i>
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
          <div className="modal-body p-4">
            
            {/* Botones de Tipo de Comparación */}
            <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
              <button
                type="button"
                className={`btn btn-sm px-3 py-2 fw-semibold ${tipoComparacion === 'dia' ? 'btn-info' : 'btn-outline-secondary text-light'}`}
                onClick={() => seleccionarTipoComparacion('dia')}
              >
                Día Anterior
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 py-2 fw-semibold ${tipoComparacion === 'semana' ? 'btn-info' : 'btn-outline-secondary text-light'}`}
                onClick={() => seleccionarTipoComparacion('semana')}
              >
                Semana Anterior
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 py-2 fw-semibold ${tipoComparacion === 'mes' ? 'btn-info' : 'btn-outline-secondary text-light'}`}
                onClick={() => seleccionarTipoComparacion('mes')}
              >
                Mes Anterior
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 py-2 fw-semibold ${tipoComparacion === 'personalizado' ? 'btn-info' : 'btn-outline-secondary text-light'}`}
                onClick={() => seleccionarTipoComparacion('personalizado')}
              >
                Personalizado
              </button>
            </div>

            {/* Configuración de Fechas de Comparación */}
            {tipoComparacion && (
              <div className="p-3 mb-4 rounded-3 border border-secondary border-opacity-25 im-surface-head">
                <div className="row g-3 align-items-center">
                  
                  {/* Período Actual */}
                  <div className="col-12 col-md-5">
                    <label className="form-label small text-info fw-bold mb-1">Período Actual</label>
                    <div className="d-flex align-items-center gap-2">
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
                    <div className="d-flex align-items-center gap-2">
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
                    className="btn btn-sm btn-primary px-4 fw-bold"
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
                  <div className="p-3 rounded-3 border border-info border-opacity-25 h-100">
                    <h6 className="fw-bold text-info mb-3">
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