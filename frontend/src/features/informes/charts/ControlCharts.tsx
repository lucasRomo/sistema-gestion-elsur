import React from 'react';
import { InformeChartRenderer } from './InformeChartRenderer';

interface ControlProps {
  metricas: any;
  esMismoDia?: boolean;
  incongruenciasArqueo?: any[];
  abrirModalComparacion: (informe: string) => void;
}

export const ControlCharts: React.FC<ControlProps> = ({
  metricas,
  esMismoDia = false,
  incongruenciasArqueo = [],
  abrirModalComparacion
}) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#f43f5e' }}>
          <i className="bi bi-shield-check me-2"></i>Control Interno y Auditoría
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-trash-fill me-2" style={{ color: '#ffc107' }}></i>Mermas y Material Desperdiciado
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('mermas')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {metricas.mermasPorPeriodo && metricas.mermasPorPeriodo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }} data-chart-id="mermas_chart">
                <InformeChartRenderer informe="mermas" data={metricas} esMismoDia={esMismoDia} />
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No se registraron mermas en este rango.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-journal-x me-2" style={{ color: '#f43f5e' }}></i>Incongruencias en Arqueos de Caja
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('incongruencias')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #f43f5e', color: '#f43f5e' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {incongruenciasArqueo && incongruenciasArqueo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }} data-chart-id="incongruencias_chart">
                <InformeChartRenderer informe="incongruencias" data={{ ...metricas, incongruenciasArqueo }} />
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">Sin registro de cierres incongruentes en este rango.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tools me-2" style={{ color: '#fd7e14' }}></i>Fallas y Averías en Máquinas
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('averias')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #fd7e14', color: '#fd7e14' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {metricas.averiasPorPeriodo && metricas.averiasPorPeriodo.length > 0 ? (
              <div style={{ height: '320px', width: '100%' }} data-chart-id="averias_chart">
                <InformeChartRenderer informe="averias" data={metricas} esMismoDia={esMismoDia} />
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No se registraron fallas mecánicas en este rango.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};