import React from 'react';
import { InformeChartRenderer } from './InformeChartRenderer';

interface OperacionesProps {
  metricas: any;
  abrirModalComparacion: (informe: string) => void;
}

export const OperacionesCharts: React.FC<OperacionesProps> = ({ metricas, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#0dcaf0' }}>
          <i className="bi bi-people-fill me-2"></i>Operaciones y Recursos Humanos
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-person-badge-fill me-2" style={{ color: '#0dcaf0' }}></i>Recaudación de Empleado por Pago Completado
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('recaudacionEmpleados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #0dcaf0', color: '#0dcaf0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="recaudacionEmpleados" data={metricas} />
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-check2-square me-2" style={{ color: '#0dcaf0' }}></i>Pedidos Completados por Empleado
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('pedidosEmpleados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #0dcaf0', color: '#0dcaf0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="pedidosEmpleados" data={metricas} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};