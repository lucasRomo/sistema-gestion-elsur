import React from 'react';
import { InformeChartRenderer } from './InformeChartRenderer';

interface ClientesProps {
  metricas: any;
  topClientes?: any[];
  abrirModalComparacion: (informe: string) => void;
}

export const ClientesCharts: React.FC<ClientesProps> = ({ metricas, topClientes = [], abrirModalComparacion }) => {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="fw-bold mb-0" style={{ color: '#ffc107' }}>
          <i className="bi bi-people me-2"></i>Análisis de Clientes
        </h3>
      </div>

      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-star-fill me-2" style={{ color: '#ffc107' }}></i>Top Clientes
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('clientes')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #ffc107', color: '#ffc107' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            {topClientes && topClientes.length > 0 ? (
              <div className="my-auto" style={{ height: '340px', width: '100%' }} data-chart-id="clientes_chart">
                <InformeChartRenderer informe="clientes" data={{ ...metricas, topClientes }} />
              </div>
            ) : (
              <div className="text-white-50 text-center py-4">No hay clientes registrados en este rango.</div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="p-4 rounded-4 h-100 shadow-sm d-flex flex-column justify-content-between im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#f43f5e' }}></i>Top Deudores
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('deudores')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #f43f5e', color: '#f43f5e' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div className="my-auto" style={{ height: '340px', width: '100%' }} data-chart-id="deudores_chart">
              <InformeChartRenderer informe="deudores" data={metricas} />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="p-4 rounded-4 shadow-sm im-surface">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
              <h5 className="fw-bold mb-0" style={{ color: '#a1a1aa' }}>
                <i className="bi bi-tags-fill me-2" style={{ color: '#20c997' }}></i>Ventas por Categoría de Cliente
              </h5>
              <button type="button" onClick={() => abrirModalComparacion('categoriasCliente')} className="btn btn-sm px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #20c997', color: '#20c997' }}>
                <i className="bi bi-arrow-left-right"></i> Comparar
              </button>
            </div>
            <div style={{ height: '300px', width: '100%' }} data-chart-id="categorias_cliente_chart">
              <InformeChartRenderer informe="categoriasCliente" data={metricas} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};