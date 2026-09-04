import React, { useState, useEffect, useMemo } from 'react';

// Modal Registros de Arqueo y Comparación
import { ModalRegistrosArqueo } from '../components/ModalRegistrosArqueos';
import { ModalComparacion } from '../components/ModalComparacion';

// Componentes del Menú y Header
import { InformesHeader } from '../components/InformesHeader';
import { KpiCardsGrid } from '../components/KpiCardsGrid';
import { ModuloMenuCards } from '../components/ModuloMenuCards';

// Componentes de Gráficos / Secciones
import { FinanzasCharts } from '../charts/FinanzasCharts';
import { VentasCharts } from '../charts/VentasCharts';
import { OperacionesCharts } from '../charts/OperacionesCharts';
import { ClientesCharts } from '../charts/ClientesCharts';
import { ControlCharts } from '../charts/ControlCharts';
import { InformeChartRenderer } from '../charts/InformeChartRenderer';
import { exportarInformePDF } from '../utils/exportarPdfUtils';

// Hooks
import { useFiltrosFecha } from '../hooks/useFiltrosFecha';
import { useInformesData } from '../hooks/useInformesData';
import { useMetricasInforme } from '../hooks/useMetricasInformes';
import { useComparacionInforme } from '../hooks/useComparacionInforme';

// Tipos y Utilidades
import type { SeccionInforme } from '../types/informeTypes';
import { generarPuntosSparkline } from '../utils/informesUtils';

const hoy = new Date().toLocaleDateString('sv-SE');

export const InformesView: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState<SeccionInforme>('MENU');
  const [showModalRegistrosArqueo, setShowModalRegistrosArqueo] = useState(false);

  // Hook centralizado que maneja la carga con apiFetch
  const datos = useInformesData();
  const { metricas, topClientes, incongruenciasArqueo, procesarMetricas } = useMetricasInforme();

  const recalcularMetricas = (fDesde: string, fHasta: string) => {
    procesarMetricas(
      fDesde,
      fHasta,
      datos.pedidosRaw,
      datos.movimientosCaja,
      true,
      datos.mermasRaw,
      datos.deudoresRaw,
      datos.turnosRaw,
      datos.averiasRaw,
      datos.categoriasClienteRaw
    );
  };

  const {
    fechaDesdeInput,
    fechaHastaInput,
    fechaDesde,
    fechaHasta,
    setFechaDesdeInput,
    setFechaHastaInput,
    confirmarRangoActual,
    handleSeleccionarHoy,
    handleSeleccionarEstaSemana,
    handleSeleccionarEsteMes,
  } = useFiltrosFecha(hoy, recalcularMetricas);

  const comparacion = useComparacionInforme({
    fechaDesdeInput,
    fechaHastaInput,
    pedidosRaw: datos.pedidosRaw,
    movimientosCaja: datos.movimientosCaja,
    turnosRaw: datos.turnosRaw,
    procesarMetricas,
  });

  const usuarioLogueado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario_logueado') || 'null');
    } catch {
      return null;
    }
  }, []);
  const esAdmin = usuarioLogueado?.rol?.nombreRol?.toUpperCase() === 'ADMIN';

  // Carga inicial: delegada a datos.cargarDatos que utiliza apiFetch internamente
  useEffect(() => {
    datos.cargarDatos(true, 'Error al cargar los informes iniciales').then((resultado) => {
      if (!resultado) return;
      procesarMetricas(
        fechaDesdeInput,
        fechaHastaInput,
        resultado.pedidosRaw,
        resultado.movimientosCaja,
        true,
        resultado.mermasRaw,
        resultado.deudoresRaw,
        resultado.turnosRaw,
        resultado.averiasRaw,
        resultado.categoriasClienteRaw
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalizar = async () => {
    confirmarRangoActual();
    const resultado = await datos.cargarDatos(false, 'Error al recalcular informes');
    if (!resultado) return;
    procesarMetricas(
      fechaDesdeInput,
      fechaHastaInput,
      resultado.pedidosRaw,
      resultado.movimientosCaja,
      true,
      resultado.mermasRaw,
      resultado.deudoresRaw,
      resultado.turnosRaw,
      resultado.averiasRaw,
      resultado.categoriasClienteRaw
    );
  };

  const handleExportarPDF = () => {
    exportarInformePDF('area-informe-exportar', fechaDesde, fechaHasta, seccionActiva, metricas);
  };

  const esMismoDia = fechaDesde === fechaHasta;

  const seccionesMenu = [
    { id: 'finanzas' as SeccionInforme, label: 'FINANZAS Y CAJA', desc: 'Evolución de ingresos, egresos y medios de pago.', icon: 'bi-cash-coin', color: '#8e45e0' },
    { id: 'ventas' as SeccionInforme, label: 'PRODUCTOS Y VENTAS', desc: 'Ranking de productos y categorías más vendidas.', icon: 'bi-bag-check', color: '#20c997' },
    { id: 'operaciones' as SeccionInforme, label: 'RENDIMIENTO Y OPERACIONES', desc: 'Desempeño de empleados y estado de pedidos.', icon: 'bi-gear', color: '#0dcaf0' },
    { id: 'clientes' as SeccionInforme, label: 'ANÁLISIS DE CLIENTES', desc: 'Top clientes y comportamiento por categoría.', icon: 'bi-people', color: '#ffc107' },
    { id: 'control' as SeccionInforme, label: 'AUDITORÍA Y CONTROL', desc: 'Incongruencias de arqueo y mermas registradas.', icon: 'bi-shield-check', color: '#dc3545' },
  ];

  const kpiCards = [
    { label: 'INGRESOS TOTALES', sub: 'YMSUR / Total', val: `$${Number(metricas.ventasTotales || 0).toLocaleString('es-AR')}`, color: '#8e45e0', icon: 'bi-currency-dollar', points: generarPuntosSparkline(11, 360, 6, 26) },
    { label: 'TICKETS GENERADOS', sub: 'Operaciones', val: metricas.ticketsGenerados || 0, color: '#20c997', icon: 'bi-receipt', points: generarPuntosSparkline(22, 360, 6, 24) },
    { label: 'TICKET PROMEDIO', sub: 'Valor Medio', val: `$${metricas.ticketPromedio || '0.00'}`, color: '#0dcaf0', icon: 'bi-graph-up-arrow', points: generarPuntosSparkline(33, 360, 6, 27) },
    { label: 'MOVIMIENTOS DE CAJA', sub: 'Registros', val: `${metricas.cantidadMovimientos || 0} reg`, color: '#ffc107', icon: 'bi-wallet2', points: generarPuntosSparkline(31, 360, 6, 25) },
  ];

  if (datos.cargando && datos.movimientosCaja.length === 0) {
    return (
      <div className="text-center text-white mt-5">
        <div className="spinner-border text-info mb-3"></div>
        <h4>Consolidando métricas del sistema...</h4>
      </div>
    );
  }

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      <style>{`
        .card-menu-item {
          background-color: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          transition: all 0.25s ease-in-out;
          cursor: pointer;
        }
        .card-menu-item:hover {
          background-color: #27272a !important;
          border-color: #52525b !important;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        }
        .btn-volver {
          background-color: #27272a;
          border: 1px solid #3f3f46;
          color: #fff;
          transition: all 0.2s ease;
        }
        .btn-volver:hover {
          background-color: #3f3f46;
          color: #fff;
        }

        .im-chart-scroll {
          scrollbar-width: thin;
          scrollbar-color: #52525b transparent;
        }
        .im-chart-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .im-chart-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .im-chart-scroll::-webkit-scrollbar-thumb {
          background-color: #52525b;
          border-radius: 10px;
        }
        .im-chart-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #a1a1aa;
        }

        .recharts-legend-wrapper::-webkit-scrollbar {
          width: 6px;
        }
        .recharts-legend-wrapper::-webkit-scrollbar-track {
          background: transparent;
        }
        .recharts-legend-wrapper::-webkit-scrollbar-thumb {
          background-color: #52525b;
          border-radius: 10px;
        }

        .recharts-wrapper *:focus {
          outline: none !important;
        }

        .recharts-sector:focus,
        .recharts-rectangle:focus,
        .recharts-bar-rectangle:focus,
        .recharts-cell:focus,
        .recharts-area-area:focus,
        .recharts-area-curve:focus,
        .recharts-line-curve:focus,
        .recharts-active-dot:focus,
        .recharts-dot:focus {
          filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px rgba(142, 69, 224, 0.6));
          transition: filter 0.15s ease-in-out;
        }
      `}</style>

      {/* HEADER DE CONTROL */}
      <InformesHeader
        fechaDesdeInput={fechaDesdeInput}
        fechaHastaInput={fechaHastaInput}
        setFechaDesdeInput={setFechaDesdeInput}
        setFechaHastaInput={setFechaHastaInput}
        handleAnalizar={handleAnalizar}
        handleSeleccionarHoy={handleSeleccionarHoy}
        handleSeleccionarEstaSemana={handleSeleccionarEstaSemana}
        handleSeleccionarEsteMes={handleSeleccionarEsteMes}
      />

      {/* BARRA SUPERIOR DE SECCIÓN ACTIVA: BOTÓN VOLVER Y EXPORTAR PDF */}
      {seccionActiva !== 'MENU' && (
        <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setSeccionActiva('MENU')}
              className="btn btn-volver btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 rounded-3"
            >
              <i className="bi bi-arrow-left"></i> Volver al Menú Principal
            </button>

            <button
              type="button"
              className="btn btn-sm btn fw-semibold px-3 py-2 rounded-3 d-none d-md-flex align-items-center gap-2"
              onClick={handleExportarPDF}
              style={{
                backgroundColor: '#6f42c1',
                borderColor: '#6f42c1',
                color: '#ffffff',
                fontSize: '0.85rem',
                paddingTop: '0.35rem',
                paddingBottom: '0.35rem',
              }}
            >
              <i className="bi bi-file-earmark-pdf"></i> Exportar PDF
            </button>
          </div>

          <span className="text-body-secondary small">
            Período: <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>
          </span>
        </div>
      )}

      {/* CONTENEDOR DE CAPTURA PDF */}
      <div id="area-informe-exportar" className="d-block w-100">
        {/* MENÚ PRINCIPAL Y KPIs */}
        {seccionActiva === 'MENU' && (
          <>
            <KpiCardsGrid kpiCards={kpiCards} />

            <ModuloMenuCards
              seccionesMenu={seccionesMenu}
              setSeccionActiva={setSeccionActiva}
              esAdmin={esAdmin}
              setShowModalRegistrosArqueo={setShowModalRegistrosArqueo}
            />
          </>
        )}

        {/* SECCIONES Y GRÁFICOS */}
        {seccionActiva === 'finanzas' && (
          <FinanzasCharts
            metricas={metricas}
            esMismoDia={esMismoDia}
            abrirModalComparacion={comparacion.abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'ventas' && (
          <VentasCharts
            metricas={metricas}
            abrirModalComparacion={comparacion.abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'operaciones' && (
          <OperacionesCharts
            metricas={metricas}
            abrirModalComparacion={comparacion.abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'clientes' && (
          <ClientesCharts
            metricas={metricas}
            topClientes={topClientes}
            abrirModalComparacion={comparacion.abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'control' && (
          <ControlCharts
            metricas={metricas}
            incongruenciasArqueo={incongruenciasArqueo}
            esMismoDia={esMismoDia}
            abrirModalComparacion={comparacion.abrirModalComparacion as (informe: string) => void}
          />
        )}
      </div>

      {/* MODALES */}
      {showModalRegistrosArqueo && (
        <ModalRegistrosArqueo
          isOpen={showModalRegistrosArqueo}
          onClose={() => setShowModalRegistrosArqueo(false)}
        />
      )}

      {comparacion.modalComparacionAbierto && (
        <ModalComparacion
          modalComparacionAbierto={comparacion.modalComparacionAbierto}
          informeComparacion={comparacion.informeComparacion}
          tipoComparacion={comparacion.tipoComparacion}
          comparacionData={comparacion.comparacionData}
          modalFechaDesdeInput={comparacion.modalFechaDesdeInput}
          modalFechaHastaInput={comparacion.modalFechaHastaInput}
          modalFechaDesdeCompInput={comparacion.modalFechaDesdeCompInput}
          modalFechaHastaCompInput={comparacion.modalFechaHastaCompInput}
          setModalFechaDesdeInput={comparacion.setModalFechaDesdeInput}
          setModalFechaHastaInput={comparacion.setModalFechaHastaInput}
          setModalFechaDesdeCompInput={comparacion.setModalFechaDesdeCompInput}
          setModalFechaHastaCompInput={comparacion.setModalFechaHastaCompInput}
          cerrarModalComparacion={comparacion.cerrarModalComparacion}
          seleccionarTipoComparacion={comparacion.seleccionarTipoComparacion}
          handleAnalizarComparacionModal={comparacion.handleAnalizarComparacionModal}
          esMismoDia={esMismoDia}
          obtenerNombreInforme={comparacion.obtenerNombreInforme}
          renderGraficoEspecifico={(informe, data, esAnterior) => (
            <InformeChartRenderer
              informe={informe}
              data={data}
              esAnterior={esAnterior}
              esMismoDia={esMismoDia}
            />
          )}
        />
      )}
    </div>
  );
};

export default InformesView;