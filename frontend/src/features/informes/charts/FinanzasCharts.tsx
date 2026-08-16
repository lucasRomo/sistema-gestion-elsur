import React from 'react';
import { InformeChartRenderer } from './InformeChartRenderer';

interface FinanzasProps {
  metricas: any;
  esMismoDia?: boolean;
  abrirModalComparacion: (informe: string) => void;
}

export const FinanzasCharts: React.FC<FinanzasProps> = ({ metricas, esMismoDia = false, abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#8e45e0' }}>
          <i className="bi bi-wallet2 me-2"></i>Finanzas y Caja
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        {/* EVOLUCIÓN DE INGRESOS A CAJA */}
        <div className="col-12 col-xl-8">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-activity me-2" style={{ color: '#8e45e0' }}></i>Evolución de Ingresos a Caja
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('ingresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #8e45e0', color: '#8e45e0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="ingresos" data={metricas} esMismoDia={esMismoDia} />
            </div>
          </div>
        </div>

        {/* TIPOS / MEDIOS DE PAGO */}
        <div className="col-12 col-xl-4">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-pie-chart-fill me-2" style={{ color: '#20c997' }}></i>Tipos / Medios de Pago
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('mediosPago')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }}>
              <InformeChartRenderer informe="mediosPago" data={metricas} esMismoDia={esMismoDia} />
            </div>
          </div>
        </div>

        {/* EGRESOS Y SALIDAS DE CAJA DETALLADOS */}
        <div className="col-12">
          <div className="p-4 rounded-4 shadow-sm im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-arrow-down-right-circle-fill me-2" style={{ color: '#e22e2e' }}></i>Egresos y Salidas de Caja Detallados
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('egresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #e22e2e', color: '#e22e2e' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {metricas.detalleEgresos && metricas.detalleEgresos.length > 0 ? (
              <div style={{ height: '280px', width: '100%' }}>
                <InformeChartRenderer informe="egresos" data={metricas} esMismoDia={esMismoDia} />
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No hay egresos registrados en el período seleccionado.</div>
            )}
          </div>
        </div>

        {/* CATEGORÍAS DE INGRESOS DE CAJA */}
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm im-surface h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tags-fill me-2" style={{ color: '#0dcaf0' }}></i>Categorías de Ingresos
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('categoriasIngresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #0dcaf0', color: '#0dcaf0' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '300px', width: '100%' }}>
              <InformeChartRenderer informe="categoriasIngresos" data={metricas} esMismoDia={esMismoDia} />
            </div>
          </div>
        </div>

        {/* CATEGORÍAS DE EGRESOS DE CAJA */}
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 shadow-sm im-surface h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-pie-chart me-2" style={{ color: '#ffc107' }}></i>Categorías de Egresos
              </h5>
              <button
                type="button"
                onClick={() => abrirModalComparacion('categoriasEgresos')}
                className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}
              >
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '300px', width: '100%' }}>
              <InformeChartRenderer informe="categoriasEgresos" data={metricas} esMismoDia={esMismoDia} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};