import React, { useState, useEffect, useMemo } from 'react';
import { pedidoService } from '../../pedidos/service/pedidoService';
import { cajaService, type MovimientoCaja } from '../../caja/services/cajaService';
import { getProductos } from '../../productos/services/productoService';
import { API_BASE_URL, apiFetch } from '../../../config/api';

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

// Tipos y Utilidades
import type {
  InformeComparacion,
  TipoComparacion,
  SeccionInforme,
  ComparacionDataState
} from '../types/informeTypes';

import {
  generarPuntosSparkline,
  procesarMetricas as procesarMetricasInforme,
  calcularIncongruenciasArqueo
} from '../utils/informesUtils';

export const InformesView: React.FC = () => {
  const hoy = new Date().toLocaleDateString('sv-SE');

  const [seccionActiva, setSeccionActiva] = useState<SeccionInforme>('MENU');

  const [fechaDesdeInput, setFechaDesdeInput] = useState(hoy);
  const [fechaHastaInput, setFechaHastaInput] = useState(hoy);

  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);

  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [mermasRaw, setMermasRaw] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [, setListaProductos] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [incongruenciasArqueo, setIncongruenciasArqueo] = useState<any[]>([]);
  const [turnosRaw, setTurnosRaw] = useState<any[]>([]);
  const [averiasRaw, setAveriasRaw] = useState<any[]>([]);
  const [categoriasClienteRaw, setCategoriasClienteRaw] = useState<any[]>([]);

  // Modales
  const [showModalRegistrosArqueo, setShowModalRegistrosArqueo] = useState(false);
  const [modalComparacionAbierto, setModalComparacionAbierto] = useState(false);
  const [informeComparacion, setInformeComparacion] = useState<InformeComparacion | null>(null);
  const [tipoComparacion, setTipoComparacion] = useState<TipoComparacion | null>(null);

  // Fechas para el modal de comparación
  const [modalFechaDesdeInput, setModalFechaDesdeInput] = useState(fechaDesdeInput);
  const [modalFechaHastaInput, setModalFechaHastaInput] = useState(fechaHastaInput);
  const [modalFechaDesdeCompInput, setModalFechaDesdeCompInput] = useState(fechaDesdeInput);
  const [modalFechaHastaCompInput, setModalFechaHastaCompInput] = useState(fechaHastaInput);
  const [deudoresRaw, setDeudoresRaw] = useState<any[]>([]);

  const [comparacionData, setComparacionData] = useState<ComparacionDataState | null>(null);

  const [metricas, setMetricas] = useState<any>({
    ventasTotales: 0,
    ticketsGenerados: 0,
    ticketPromedio: '0.00',
    cantidadMovimientos: 0,
    ventasPorPeriodo: [],
    distribucionMediosPago: [],
    distribucionEstados: [],
    rendimientoEmpleados: [],
    pedidosCompletadosPorEmpleado: [],
    pedidosDevueltosPorEmpleado: [],
    detalleEgresos: [],
    mermasPorPeriodo: [],
    averiasPorPeriodo: [],
    productosMasVendidos: [],
    categoriasMasVendidas: [],
    ventasPorCategoriaCliente: [],
    topClientes: []
  });

  const handleExportarPDF = () => {
    exportarInformePDF('area-informe-exportar', fechaDesde, fechaHasta, seccionActiva, metricas);
  };

  const usuarioLogueado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario_logueado') || 'null');
    } catch {
      return null;
    }
  }, []);
  const esAdmin = usuarioLogueado?.rol?.nombreRol?.toUpperCase() === 'ADMIN';

  const procesarMetricas = (
    fDesde: string,
    fHasta: string,
    pedidosLista = pedidosRaw,
    cajaLista = movimientosCaja,
    actualizarEstado = true,
    mermasListaParam = mermasRaw,
    deudoresListaParam = deudoresRaw,
    turnosListaParam = turnosRaw,
    averiasListaParam = averiasRaw,
    categoriasListaParam = categoriasClienteRaw  
  ) => {
    const resultado = procesarMetricasInforme(
      fDesde,
      fHasta,
      pedidosLista,
      cajaLista,
      mermasListaParam,
      deudoresListaParam,
      averiasListaParam,
      categoriasListaParam  
    );

    if (actualizarEstado) {
      setMetricas(resultado);
      setTopClientes(resultado.topClientes);
      setIncongruenciasArqueo(calcularIncongruenciasArqueo(turnosListaParam, fDesde, fHasta));
    }

    return resultado;
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargando(true);
      try {
        const [dataPedidos, dataCaja, dataProductos, resMermas, resDeudores, dataTurnos, resAverias, resCategorias] = await Promise.all([
  pedidoService.obtenerTodos(),
  cajaService.obtenerTodos(),
  getProductos(),
  apiFetch(`${API_BASE_URL}/mermas`),
  apiFetch(`${API_BASE_URL}/cuentas-corrientes/resumen-deudores`),
  cajaService.obtenerTodosLosTurnos(),
  apiFetch(`${API_BASE_URL}/incidencias`),
  apiFetch(`${API_BASE_URL}/categorias-cliente`)
]);

        const pedidosValidos = dataPedidos || [];
        const cajaValida = dataCaja || [];
        const mermasValidas = resMermas.ok ? await resMermas.json() : [];
        const deudoresValidos = resDeudores.ok ? await resDeudores.json() : [];
        const averiasValidas = resAverias.ok ? await resAverias.json() : [];
        const categoriasValidas = resCategorias.ok ? await resCategorias.json() : [];

        setTurnosRaw(dataTurnos || []); 
        setPedidosRaw(pedidosValidos);
        setMovimientosCaja(cajaValida);
        setListaProductos(dataProductos || []);
        setMermasRaw(mermasValidas);
        setDeudoresRaw(deudoresValidos);
        setAveriasRaw(averiasValidas);
        setCategoriasClienteRaw(categoriasValidas); 

        procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida, true, mermasValidas, deudoresValidos, dataTurnos, averiasValidas, categoriasValidas);
      } catch (error) {
        console.error("Error al cargar los informes iniciales:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  const handleAnalizar = async () => {
    setCargando(true);
    try {
      setFechaDesde(fechaDesdeInput);
      setFechaHasta(fechaHastaInput);

      const [nuevosPedidos, nuevosMovimientos, resMermas, resDeudores, nuevosTurnos, resAverias, resCategorias] = await Promise.all([
  pedidoService.obtenerTodos(),
  cajaService.obtenerTodos(),
  apiFetch(`${API_BASE_URL}/mermas`),
  apiFetch(`${API_BASE_URL}/cuentas-corrientes/resumen-deudores`),
  cajaService.obtenerTodosLosTurnos(),
  apiFetch(`${API_BASE_URL}/incidencias`),
  apiFetch(`${API_BASE_URL}/categorias-cliente`)
]);

      const pedidosValidos = nuevosPedidos || [];
      const cajaValida = nuevosMovimientos || [];
      const mermasValidas = resMermas.ok ? await resMermas.json() : [];
      const deudoresValidos = resDeudores.ok ? await resDeudores.json() : [];
      const averiasValidas = resAverias.ok ? await resAverias.json() : [];
      const categoriasValidas = resCategorias.ok ? await resCategorias.json() : [];

      setTurnosRaw(nuevosTurnos || []); 
      setPedidosRaw(pedidosValidos);
      setMovimientosCaja(cajaValida);
      setMermasRaw(mermasValidas);
      setDeudoresRaw(deudoresValidos);
      setAveriasRaw(averiasValidas);
      setCategoriasClienteRaw(categoriasValidas); 

      procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida, true, mermasValidas, deudoresValidos, nuevosTurnos, averiasValidas, categoriasValidas);
    } catch (error) {
      console.error("Error al recalcular informes:", error);
    } finally {
      setCargando(false);
    }
  };

  const esMismoDia = fechaDesde === fechaHasta;

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSeleccionarHoy = () => {
    const hoyObj = new Date();
    const fechaStr = formatDateForInput(hoyObj);
    setFechaDesdeInput(fechaStr);
    setFechaHastaInput(fechaStr);
    setFechaDesde(fechaStr);
    setFechaHasta(fechaStr);

    procesarMetricas(fechaStr, fechaStr, pedidosRaw, movimientosCaja, true, mermasRaw);
  };

  const handleSeleccionarEstaSemana = () => {
    const hoyObj = new Date();
    const hace6Dias = new Date(hoyObj);
    hace6Dias.setDate(hace6Dias.getDate() - 6);

    const desdeStr = formatDateForInput(hace6Dias);
    const hastaStr = formatDateForInput(hoyObj);

    setFechaDesdeInput(desdeStr);
    setFechaHastaInput(hastaStr);
    setFechaDesde(desdeStr);
    setFechaHasta(hastaStr);

    procesarMetricas(desdeStr, hastaStr, pedidosRaw, movimientosCaja, true, mermasRaw);
  };

  const handleSeleccionarEsteMes = () => {
    const hoyObj = new Date();
    const primerDiaMes = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), 1);

    const desdeStr = formatDateForInput(primerDiaMes);
    const hastaStr = formatDateForInput(hoyObj);

    setFechaDesdeInput(desdeStr);
    setFechaHastaInput(hastaStr);
    setFechaDesde(desdeStr);
    setFechaHasta(hastaStr);

    procesarMetricas(desdeStr, hastaStr, pedidosRaw, movimientosCaja, true, mermasRaw);
  };

  const obtenerNombreInforme = (informe: InformeComparacion | null): string => {
    if (!informe) return '';
    const nombres: Record<InformeComparacion, string> = {
      ingresos: 'Evolución de Ingresos a Caja',
      mediosPago: 'Tipos / Medios de Pago',
      egresos: 'Egresos y Salidas de Caja Detallados',
      estados: 'Distribución por Estados',
      productos: 'Productos Más Vendidos',
      categorias: 'Categorías Más Vendidas',
      recaudacionEmpleados: 'Recaudación de Empleado por Pago Completado',
      pedidosEmpleados: 'Pedidos Completados por Empleado',
      pedidosdevueltosempleado: 'Pedidos Devueltos / Cancelados por Empleado',
      clientes: 'Clientes Más Activos',
      deudores: 'Clientes con más Deuda',
      categoriasCliente: 'Ventas por Categoría de Cliente',
      categoriasIngresos: 'Movimientos por Categorías de Ingresos',
      categoriasEgresos: 'Movimientos por Categorías de Egresos',
      tiempoPromedioPedido: 'Promedio de Tiempo de Finalizacion de Pedido',
      tiempoMaximoEmpleado: 'Tiempo Maximo de Tardanza de Finalización de Empleado',
      mermas: 'Registro de Mermas',
      averias: 'Registro de Averías',
      incongruencias: 'Incongruencias de Arqueo'
    };
    return nombres[informe] || '';
  };

  const abrirModalComparacion = (informe: InformeComparacion) => {
    setInformeComparacion(informe);
    setModalFechaDesdeInput(fechaDesdeInput);
    setModalFechaHastaInput(fechaHastaInput);
    setModalFechaDesdeCompInput(fechaDesdeInput);
    setModalFechaHastaCompInput(fechaHastaInput);
    setTipoComparacion('dia');

    const [y, m, d] = fechaDesdeInput.split('-').map(Number);
    const [yH, mH, dH] = fechaHastaInput.split('-').map(Number);
    const dAct = new Date(y, m - 1, d);
    const hAct = new Date(yH, mH - 1, dH);
    const diffDias = Math.max(1, Math.round((hAct.getTime() - dAct.getTime()) / 86400000) + 1);
    
    const antD = new Date(dAct);
    const antH = new Date(hAct);
    antD.setDate(antD.getDate() - diffDias);
    antH.setDate(antH.getDate() - diffDias);

    const antDesdeStr = formatDateForInput(antD);
    const antHastaStr = formatDateForInput(antH);

    setModalFechaDesdeCompInput(antDesdeStr);
    setModalFechaHastaCompInput(antHastaStr);

    const metricasActuales = procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosRaw, movimientosCaja, false);
    const metricasAnteriores = procesarMetricas(antDesdeStr, antHastaStr, pedidosRaw, movimientosCaja, false);

    setComparacionData({
      actual: {
        ...metricasActuales,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, fechaDesdeInput, fechaHastaInput)
      },
      anterior: {
        ...metricasAnteriores,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, antDesdeStr, antHastaStr)
      },
      periodoActual: { desde: fechaDesdeInput, hasta: fechaHastaInput },
      periodoAnterior: { desde: antDesdeStr, hasta: antHastaStr }
    });

    setModalComparacionAbierto(true);
  };

  const cerrarModalComparacion = () => {
    setModalComparacionAbierto(false);
    setInformeComparacion(null);
    setTipoComparacion(null);
    setComparacionData(null);
  };

  const handleAnalizarComparacionModal = () => {
    if (!informeComparacion) return;

    const metricasActuales = procesarMetricas(
      modalFechaDesdeInput,
      modalFechaHastaInput,
      pedidosRaw,
      movimientosCaja,
      false
    );

    const metricasAnteriores = procesarMetricas(
      modalFechaDesdeCompInput,
      modalFechaHastaCompInput,
      pedidosRaw,
      movimientosCaja,
      false
    );

    setComparacionData({
      actual: {
        ...metricasActuales,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, modalFechaDesdeInput, modalFechaHastaInput)
      },
      anterior: {
        ...metricasAnteriores,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, modalFechaDesdeCompInput, modalFechaHastaCompInput)
      },
      periodoActual: { desde: modalFechaDesdeInput, hasta: modalFechaHastaInput },
      periodoAnterior: { desde: modalFechaDesdeCompInput, hasta: modalFechaHastaCompInput }
    });
  };

  const seleccionarTipoComparacion = (tipo: TipoComparacion) => {
    if (!informeComparacion) return;
    setTipoComparacion(tipo);

    const parse = (v: string) => {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const dAct = parse(modalFechaDesdeInput);
    const hAct = parse(modalFechaHastaInput);

    let pActual = { desde: modalFechaDesdeInput, hasta: modalFechaHastaInput };
    let pAnterior = { desde: modalFechaDesdeInput, hasta: modalFechaHastaInput };

    if (tipo === 'dia' || tipo === 'personalizado') {
      const diffDias = Math.max(1, Math.round((hAct.getTime() - dAct.getTime()) / 86400000) + 1);
      const antD = new Date(dAct);
      const antH = new Date(hAct);
      antD.setDate(antD.getDate() - diffDias);
      antH.setDate(antH.getDate() - diffDias);

      pAnterior = { desde: formatDateForInput(antD), hasta: formatDateForInput(antH) };
    } else if (tipo === 'semana') {
      const actualHasta = parse(modalFechaHastaInput);
      const actualDesde = new Date(actualHasta);
      actualDesde.setDate(actualDesde.getDate() - 6);

      const anteriorHasta = new Date(actualDesde);
      anteriorHasta.setDate(anteriorHasta.getDate() - 1);
      const anteriorDesde = new Date(anteriorHasta);
      anteriorDesde.setDate(anteriorDesde.getDate() - 6);

      pActual = { desde: formatDateForInput(actualDesde), hasta: formatDateForInput(actualHasta) };
      pAnterior = { desde: formatDateForInput(anteriorDesde), hasta: formatDateForInput(anteriorHasta) };
    } else if (tipo === 'mes') {
      const actualHasta = parse(modalFechaHastaInput);
      const actualDesde = new Date(actualHasta.getFullYear(), actualHasta.getMonth(), 1);
      const anteriorHasta = new Date(actualDesde);
      anteriorHasta.setDate(anteriorHasta.getDate() - 1);
      const anteriorDesde = new Date(anteriorHasta.getFullYear(), anteriorHasta.getMonth(), 1);

      pActual = { desde: formatDateForInput(actualDesde), hasta: formatDateForInput(actualHasta) };
      pAnterior = { desde: formatDateForInput(anteriorDesde), hasta: formatDateForInput(anteriorHasta) };
    }

    setModalFechaDesdeInput(pActual.desde);
    setModalFechaHastaInput(pActual.hasta);
    setModalFechaDesdeCompInput(pAnterior.desde);
    setModalFechaHastaCompInput(pAnterior.hasta);

    const metricasActuales = procesarMetricas(pActual.desde, pActual.hasta, pedidosRaw, movimientosCaja, false);
    const metricasAnteriores = procesarMetricas(pAnterior.desde, pAnterior.hasta, pedidosRaw, movimientosCaja, false);

    setComparacionData({
      actual: metricasActuales,
      anterior: metricasAnteriores,
      periodoActual: pActual,
      periodoAnterior: pAnterior
    });
  };

  const seccionesMenu = [
    {
      id: 'finanzas' as SeccionInforme,
      label: 'FINANZAS Y CAJA',
      desc: 'Evolución de ingresos, egresos y medios de pago.',
      icon: 'bi-cash-coin',
      color: '#8e45e0'
    },
    {
      id: 'ventas' as SeccionInforme,
      label: 'PRODUCTOS Y VENTAS',
      desc: 'Ranking de productos y categorías más vendidas.',
      icon: 'bi-bag-check',
      color: '#20c997'
    },
    {
      id: 'operaciones' as SeccionInforme,
      label: 'RENDIMIENTO Y OPERACIONES',
      desc: 'Desempeño de empleados y estado de pedidos.',
      icon: 'bi-gear',
      color: '#0dcaf0'
    },
    {
      id: 'clientes' as SeccionInforme,
      label: 'ANÁLISIS DE CLIENTES',
      desc: 'Top clientes y comportamiento por categoría.',
      icon: 'bi-people',
      color: '#ffc107'
    },
    {
      id: 'control' as SeccionInforme,
      label: 'AUDITORÍA Y CONTROL',
      desc: 'Incongruencias de arqueo y mermas registradas.',
      icon: 'bi-shield-check',
      color: '#dc3545'
    }
  ];

  const kpiCards = [
    {
      label: 'INGRESOS TOTALES',
      sub: 'YMSUR / Total',
      val: `$${Number(metricas.ventasTotales || 0).toLocaleString('es-AR')}`,
      color: '#8e45e0',
      icon: 'bi-currency-dollar',
      points: generarPuntosSparkline(11, 360, 6, 26)
    },
    {
      label: 'TICKETS GENERADOS',
      sub: 'Operaciones',
      val: metricas.ticketsGenerados || 0,
      color: '#20c997',
      icon: 'bi-receipt',
      points: generarPuntosSparkline(22, 360, 6, 24)
    },
    {
      label: 'TICKET PROMEDIO',
      sub: 'Valor Medio',
      val: `$${metricas.ticketPromedio || '0.00'}`,
      color: '#0dcaf0',
      icon: 'bi-graph-up-arrow',
      points: generarPuntosSparkline(33, 360, 6, 27)
    },
    {
      label: 'MOVIMIENTOS DE CAJA',
      sub: 'Registros',
      val: `${metricas.cantidadMovimientos || 0} reg`,
      color: '#ffc107',
      icon: 'bi-wallet2',
      points: generarPuntosSparkline(31, 360, 6, 25)
    }
  ];

  if (cargando && movimientosCaja.length === 0) {
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
    paddingBottom: '0.35rem'
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
            abrirModalComparacion={abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'ventas' && (
          <VentasCharts
            metricas={metricas}
            abrirModalComparacion={abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'operaciones' && (
          <OperacionesCharts
            metricas={metricas}
            abrirModalComparacion={abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'clientes' && (
          <ClientesCharts
            metricas={metricas}
            topClientes={topClientes}
            abrirModalComparacion={abrirModalComparacion as (informe: string) => void}
          />
        )}

        {seccionActiva === 'control' && (
          <ControlCharts
            metricas={metricas}
            incongruenciasArqueo={incongruenciasArqueo}
            esMismoDia={esMismoDia}
            abrirModalComparacion={abrirModalComparacion as (informe: string) => void}
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

      {modalComparacionAbierto && (
        <ModalComparacion
          modalComparacionAbierto={modalComparacionAbierto}
          informeComparacion={informeComparacion}
          tipoComparacion={tipoComparacion}
          comparacionData={comparacionData}
          modalFechaDesdeInput={modalFechaDesdeInput}
          modalFechaHastaInput={modalFechaHastaInput}
          modalFechaDesdeCompInput={modalFechaDesdeCompInput}
          modalFechaHastaCompInput={modalFechaHastaCompInput}
          setModalFechaDesdeInput={setModalFechaDesdeInput}
          setModalFechaHastaInput={setModalFechaHastaInput}
          setModalFechaDesdeCompInput={setModalFechaDesdeCompInput}
          setModalFechaHastaCompInput={setModalFechaHastaCompInput}
          cerrarModalComparacion={cerrarModalComparacion}
          seleccionarTipoComparacion={seleccionarTipoComparacion}
          handleAnalizarComparacionModal={handleAnalizarComparacionModal}
          esMismoDia={esMismoDia}
          obtenerNombreInforme={obtenerNombreInforme}
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