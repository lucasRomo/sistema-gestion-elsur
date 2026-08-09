import React, { useState, useEffect, useMemo } from 'react';
import { pedidoService } from '../../pedidos/service/pedidoService';
import { cajaService, type MovimientoCaja } from '../../caja/services/cajaService';
import { getProductos } from '../../productos/services/productoService';

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

// Tipos y Utilidades
import type {
  InformeComparacion,
  TipoComparacion,
  SeccionInforme,
  ComparacionDataState
} from '../types/informeTypes';

import {
  MERMAS_MOCK,
  AVERIAS_MOCK,
  generarPuntosSparkline,
  procesarMetricas as procesarMetricasInforme
} from '../utils/informesUtils';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
const COLORES_TORTA = ['#8e45e0', '#20c997', '#e22e2e', '#0dcaf0', '#ffc107'];

export const InformesView: React.FC = () => {
  const hoy = new Date().toLocaleDateString('sv-SE');

  const [seccionActiva, setSeccionActiva] = useState<SeccionInforme>('MENU');

  const [fechaDesdeInput, setFechaDesdeInput] = useState(hoy);
  const [fechaHastaInput, setFechaHastaInput] = useState(hoy);

  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);

  const [pedidosRaw, setPedidosRaw] = useState<any[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [, setListaProductos] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [incongruenciasArqueo, setIncongruenciasArqueo] = useState<any[]>([]);

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

  const [comparacionData, setComparacionData] = useState<ComparacionDataState | null>(null);

  const usuarioLogueado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario_logueado') || 'null');
    } catch {
      return null;
    }
  }, []);
  const esAdmin = usuarioLogueado?.rol?.nombreRol?.toUpperCase() === 'ADMIN';

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
    detalleEgresos: [],
    mermasPorPeriodo: [],
    averiasPorPeriodo: [],
    productosMasVendidos: [],
    categoriasMasVendidas: [],
    ventasPorCategoriaCliente: [],
    topClientes: []
  });

  const procesarMetricas = (
    fDesde: string,
    fHasta: string,
    pedidosLista = pedidosRaw,
    cajaLista = movimientosCaja,
    actualizarEstado = true
  ) => {
    // Pasar únicamente los 4 argumentos que acepta la función
    const resultado = procesarMetricasInforme(
      fDesde,
      fHasta,
      pedidosLista,
      cajaLista
    );

    if (actualizarEstado) {
      setMetricas(resultado);
      setTopClientes(resultado.topClientes);
      setIncongruenciasArqueo([
        { empleado: 'Pepe', montoDiferencia: 1500, cantidadIncongruencias: 2 },
        { empleado: 'Martina', montoDiferencia: 850, cantidadIncongruencias: 1 },
        { empleado: 'Luca', montoDiferencia: 400, cantidadIncongruencias: 1 },
        { empleado: 'Anabel', montoDiferencia: 200, cantidadIncongruencias: 1 }
      ]);
    }

    return resultado;
  };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargando(true);
      try {
        const [dataPedidos, dataCaja, dataProductos] = await Promise.all([
          pedidoService.obtenerTodos(),
          cajaService.obtenerTodos(),
          getProductos()
        ]);

        const pedidosValidos = dataPedidos || [];
        const cajaValida = dataCaja || [];

        setPedidosRaw(pedidosValidos);
        setMovimientosCaja(cajaValida);
        setListaProductos(dataProductos || []);

        procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida, true);
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

      const [nuevosPedidos, nuevosMovimientos] = await Promise.all([
        pedidoService.obtenerTodos(),
        cajaService.obtenerTodos()
      ]);

      const pedidosValidos = nuevosPedidos || [];
      const cajaValida = nuevosMovimientos || [];

      setPedidosRaw(pedidosValidos);
      setMovimientosCaja(cajaValida);

      procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosValidos, cajaValida, true);
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

    procesarMetricas(fechaStr, fechaStr, pedidosRaw, movimientosCaja, true);
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

    procesarMetricas(desdeStr, hastaStr, pedidosRaw, movimientosCaja, true);
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

    procesarMetricas(desdeStr, hastaStr, pedidosRaw, movimientosCaja, true);
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
      clientes: 'Clientes Más Activos',
      categoriasCliente: 'Ventas por Categoría de Cliente'
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

  // Calcular el período anterior por defecto (ej. mismo rango pero restándole los días correspondientes)
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
    actual: metricasActuales,
    anterior: metricasAnteriores,
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
      actual: metricasActuales,
      anterior: metricasAnteriores,
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

  const CustomAreaTooltip = ({ active, payload, label, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const saldoAcumulado = payload[0].value;
    const esEgreso = data.esEgreso;
    const montoMovimiento = data.montoMovimiento || 0;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: `1px solid ${esEgreso ? '#e22e2e' : '#8e45e0'}`, fontSize: '0.85rem' }}>
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2 pb-1 border-bottom border-secondary border-opacity-25">
          <span className="fw-bold text-body-secondary">{label}</span>
          {esMismoDia && (
            <span className={`fw-bold badge ${esEgreso ? 'bg-danger' : 'bg-success'}`}>
              {esEgreso ? `- $${Math.abs(montoMovimiento).toLocaleString('es-AR')}` : `+ $${Math.abs(montoMovimiento).toLocaleString('es-AR')}`}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="text-body-secondary">Estado Caja:</span>
          <span className="fw-bold" style={{ color: '#20c997' }}>${saldoAcumulado.toLocaleString('es-AR')}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomEgresoTooltip = ({ active, payload, esMismoDia }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #e22e2e', fontSize: '0.85rem' }}>
        <div className="fw-bold text-body-secondary mb-1 border-bottom border-secondary border-opacity-25 pb-1">{data.ejeX}</div>
        <div className="fw-bold text-danger mb-1">Total Egreso: - ${Math.abs(data.monto).toLocaleString('es-AR')}</div>
        {esMismoDia && (
          <div className="small text-body-secondary">
            <strong className="text-body">Razón / Desc:</strong> {data.descripcion || 'Sin descripción'}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomEmpleadoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 rounded-3 shadow-lg im-surface" style={{ border: '1px solid #0dcaf0', fontSize: '0.85rem' }}>
        <div className="fw-bold text-info mb-1 border-bottom border-secondary border-opacity-25 pb-1">{data.name}</div>
        <div className="text-body-secondary">
          <strong className="text-body">Ventas / Recaudación:</strong> ${Number(data.ventas || 0).toLocaleString('es-AR')}
        </div>
        <div className="text-body-secondary">
          <strong className="text-body">Pedidos completados:</strong> {data.pedidosCompletados || 0}
        </div>
      </div>
    );
  }
  return null;
};

// --- Dentro del componente InformesView, reemplaza tu renderGraficoEspecifico por esto: ---
const renderGraficoEspecifico = (informe: InformeComparacion, data: any, esAnterior = false) => {
  if (!data) return null;
  const colorBase = esAnterior ? '#71717a' : '#8e45e0';

  switch (informe) {
    case 'ingresos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.ventasPorPeriodo} margin={{ top: 10, right: 35, left: 0, bottom: 15 }}>
            <defs>
              <linearGradient id={`colorVentas_${esAnterior ? 'ant' : 'act'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorBase} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colorBase} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip content={<CustomAreaTooltip esMismoDia={esMismoDia} />} />
            <Area type="monotone" dataKey="ventas" stroke={colorBase} strokeWidth={3} fillOpacity={1} fill={`url(#colorVentas_${esAnterior ? 'ant' : 'act'})`} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'mediosPago':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.distribucionMediosPago} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
              {data.distribucionMediosPago?.map((_: any, index: number) => (
                <Cell key={`cell-pago-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'egresos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.detalleEgresos} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="ejeX" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEgresoTooltip esMismoDia={esMismoDia} />} />
            <Bar dataKey="monto" fill={esAnterior ? '#71717a' : '#e22e2e'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'estados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.distribucionEstados} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.distribucionEstados?.map((_: any, index: number) => (
                <Cell key={`cell-estado-${index}`} fill={COLORES_TORTA[(index + 2) % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'productos':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.productosMasVendidos} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.productosMasVendidos?.map((_: any, index: number) => (
                <Cell key={`cell-prod-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const colorSlice = item.color || '#20c997';
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.nombreReal || item.name}</p>
                      <p className="small mb-0">{item.name} — Unidades vendidas: <span className="text-white fw-bold">{item.value}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categorias':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.categoriasMasVendidas} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <RechartsTooltip cursor={{ fill: '#222122' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#8e45e0', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#8e45e0'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'recaudacionEmpleados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.rendimientoEmpleados} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={false} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
            <RechartsTooltip cursor={{ fill: '#222122' }} content={<CustomEmpleadoTooltip />} />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#0dcaf0'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pedidosEmpleados':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.pedidosCompletadosPorEmpleado} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
              {data.pedidosCompletadosPorEmpleado?.map((_: any, index: number) => (
                <Cell key={`cell-emp-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#222122', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'clientes':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.topClientes} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="totalGastado" stroke="none">
              {data.topClientes?.map((_: any, index: number) => (
                <Cell key={`cell-cliente-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const colorSlice = item.color || '#ffc107';
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: `1px solid ${colorSlice}`, color: '#fff' }}>
                      <p className="fw-bold mb-1" style={{ color: colorSlice }}>{item.nombreReal || item.name}</p>
                      <p className="small mb-1 text-white">Total Pagado: <span className="fw-bold">${Number(item.totalGastado).toLocaleString('es-AR')}</span></p>
                      <p className="small mb-0 text-white-50">Pedidos creados: {item.cantidadPedidos}</p>
                      <p className="small mb-0 text-success">Total Ahorrado: <span className="fw-bold">${Number(item.montoAhorrado || 0).toLocaleString('es-AR')}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: '#a1a1aa' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'categoriasCliente':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.ventasPorCategoriaCliente} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" vertical={false} />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <RechartsTooltip
              cursor={{ fill: '#222122' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="p-2 rounded-3 shadow-lg" style={{ backgroundColor: '#222122', border: '1px solid #20c997', color: '#fff' }}>
                      <p className="fw-bold mb-1 text-success">{item.name}</p>
                      <p className="small mb-1 text-white">Pedidos solicitados: <span className="fw-bold">{item.ventas}</span></p>
                      <p className="small mb-0 text-white-50">Monto total: <span className="fw-bold text-white">${Number(item.montoTotal || 0).toLocaleString('es-AR')}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ventas" fill={esAnterior ? '#71717a' : '#20c997'} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
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

      {/* BOTÓN VOLVER AL MENÚ */}
      {seccionActiva !== 'MENU' && (
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <button
            onClick={() => setSeccionActiva('MENU')}
            className="btn btn-volver btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 rounded-3"
          >
            <i className="bi bi-arrow-left"></i> Volver al Menú Principal
          </button>
          <span className="text-body-secondary small">
            Período: <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>
          </span>
        </div>
      )}

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
        />
      )}

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
    renderGraficoEspecifico={renderGraficoEspecifico}
  />
)}
    </div>
  );
};