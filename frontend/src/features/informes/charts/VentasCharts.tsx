import React from 'react';
import { InformeChartRenderer } from './InformeChartRenderer';

interface VentasProps {
  metricas: any;
  abrirModalComparacion: (informe: string) => void;
}

export const VentasCharts: React.FC<VentasProps> = ({ metricas, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#20c997' }}>
          <i className="bi bi-bag-check-fill me-2"></i>Ventas y Productos
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-diagram-3-fill me-2" style={{ color: '#ffc107' }}></i>Distribución por Estados
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('estados')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="estados" data={metricas} />
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-box-seam-fill me-2" style={{ color: '#20c997' }}></i>Productos Más Vendidos
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('productos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="productos" data={metricas} />
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tags-fill me-2" style={{ color: '#8e45e0' }}></i>Categorías Más Vendidas
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('categorias')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #8e45e0', color: '#8e45e0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="categorias" data={metricas} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};