import { useState } from 'react';
import type {
  ComparacionDataState,
  InformeComparacion,
  TipoComparacion,
} from '../types/informeTypes';
import { calcularIncongruenciasArqueo } from '../utils/informesUtils';
import { formatDateForInput } from './useFiltrosFecha';

const NOMBRES_INFORME: Record<InformeComparacion, string> = {
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
  incongruencias: 'Incongruencias de Arqueo',
};

const parseFecha = (v: string): Date => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
};

type ProcesarMetricasFn = (
  fDesde: string,
  fHasta: string,
  pedidosLista: any[],
  cajaLista: any[],
  actualizarEstado?: boolean,
  mermasListaParam?: any[],
  deudoresListaParam?: any[],
  turnosListaParam?: any[],
  averiasListaParam?: any[],
  categoriasListaParam?: any[]
) => any;

interface UseComparacionInformeParams {
  fechaDesdeInput: string;
  fechaHastaInput: string;
  pedidosRaw: any[];
  movimientosCaja: any[];
  turnosRaw: any[];
  mermasRaw?: any[];
  deudoresRaw?: any[];
  averiasRaw?: any[];
  categoriasClienteRaw?: any[];
  procesarMetricas: ProcesarMetricasFn;
}

export function useComparacionInforme({
  fechaDesdeInput,
  fechaHastaInput,
  pedidosRaw,
  movimientosCaja,
  turnosRaw,
  mermasRaw = [],
  deudoresRaw = [],
  averiasRaw = [],
  categoriasClienteRaw = [],
  procesarMetricas,
}: UseComparacionInformeParams) {
  const [modalComparacionAbierto, setModalComparacionAbierto] = useState(false);
  const [informeComparacion, setInformeComparacion] = useState<InformeComparacion | null>(null);
  const [tipoComparacion, setTipoComparacion] = useState<TipoComparacion | null>(null);
  const [comparacionData, setComparacionData] = useState<ComparacionDataState | null>(null);
  const [errorRangoComparacion, setErrorRangoComparacion] = useState<string | null>(null);

  const [modalFechaDesdeInput, setModalFechaDesdeInput] = useState(fechaDesdeInput);
  const [modalFechaHastaInput, setModalFechaHastaInput] = useState(fechaHastaInput);
  const [modalFechaDesdeCompInput, setModalFechaDesdeCompInput] = useState(fechaDesdeInput);
  const [modalFechaHastaCompInput, setModalFechaHastaCompInput] = useState(fechaHastaInput);

  const obtenerNombreInforme = (informe: InformeComparacion | null): string => {
    if (!informe) return '';
    return NOMBRES_INFORME[informe] || '';
  };

  const abrirModalComparacion = (informe: InformeComparacion) => {
    setInformeComparacion(informe);
    setModalFechaDesdeInput(fechaDesdeInput);
    setModalFechaHastaInput(fechaHastaInput);
    setTipoComparacion('dia');

    const dAct = parseFecha(fechaDesdeInput);
    const hAct = parseFecha(fechaHastaInput);
    const diffDias = Math.max(1, Math.round((hAct.getTime() - dAct.getTime()) / 86400000) + 1);

    const antD = new Date(dAct);
    const antH = new Date(hAct);
    antD.setDate(antD.getDate() - diffDias);
    antH.setDate(antH.getDate() - diffDias);

    const antDesdeStr = formatDateForInput(antD);
    const antHastaStr = formatDateForInput(antH);

    setModalFechaDesdeCompInput(antDesdeStr);
    setModalFechaHastaCompInput(antHastaStr);
    setErrorRangoComparacion(null);

    // CORREGIDO: antes no se pasaban mermas/deudores/averías/categorías de
    // cliente, por lo que la comparación de períodos siempre mostraba estos
    // informes vacíos (en 0), sin importar los datos reales.
    const metricasActuales = procesarMetricas(fechaDesdeInput, fechaHastaInput, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);
    const metricasAnteriores = procesarMetricas(antDesdeStr, antHastaStr, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);

    setComparacionData({
      actual: {
        ...metricasActuales,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, fechaDesdeInput, fechaHastaInput),
      },
      anterior: {
        ...metricasAnteriores,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, antDesdeStr, antHastaStr),
      },
      periodoActual: { desde: fechaDesdeInput, hasta: fechaHastaInput },
      periodoAnterior: { desde: antDesdeStr, hasta: antHastaStr },
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

    // CORREGIDO: se valida que en ambos períodos (actual y a comparar)
    // la fecha "Desde" no sea posterior a la fecha "Hasta"; antes un rango
    // invertido cargado a mano en el modal producía gráficos vacíos sin
    // ningún aviso.
    if (modalFechaDesdeInput > modalFechaHastaInput || modalFechaDesdeCompInput > modalFechaHastaCompInput) {
      setErrorRangoComparacion('En ambos períodos, la fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }
    setErrorRangoComparacion(null);

    const metricasActuales = procesarMetricas(modalFechaDesdeInput, modalFechaHastaInput, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);
    const metricasAnteriores = procesarMetricas(modalFechaDesdeCompInput, modalFechaHastaCompInput, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);

    setComparacionData({
      actual: {
        ...metricasActuales,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, modalFechaDesdeInput, modalFechaHastaInput),
      },
      anterior: {
        ...metricasAnteriores,
        incongruenciasArqueo: calcularIncongruenciasArqueo(turnosRaw, modalFechaDesdeCompInput, modalFechaHastaCompInput),
      },
      periodoActual: { desde: modalFechaDesdeInput, hasta: modalFechaHastaInput },
      periodoAnterior: { desde: modalFechaDesdeCompInput, hasta: modalFechaHastaCompInput },
    });
  };

  const seleccionarTipoComparacion = (tipo: TipoComparacion) => {
    if (!informeComparacion) return;
    setTipoComparacion(tipo);

    const dAct = parseFecha(modalFechaDesdeInput);
    const hAct = parseFecha(modalFechaHastaInput);

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
      const actualHasta = parseFecha(modalFechaHastaInput);
      const actualDesde = new Date(actualHasta);
      actualDesde.setDate(actualDesde.getDate() - 6);

      const anteriorHasta = new Date(actualDesde);
      anteriorHasta.setDate(anteriorHasta.getDate() - 1);
      const anteriorDesde = new Date(anteriorHasta);
      anteriorDesde.setDate(anteriorDesde.getDate() - 6);

      pActual = { desde: formatDateForInput(actualDesde), hasta: formatDateForInput(actualHasta) };
      pAnterior = { desde: formatDateForInput(anteriorDesde), hasta: formatDateForInput(anteriorHasta) };
    } else if (tipo === 'mes') {
      const actualHasta = parseFecha(modalFechaHastaInput);
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
    setErrorRangoComparacion(null);

    const metricasActuales = procesarMetricas(pActual.desde, pActual.hasta, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);
    const metricasAnteriores = procesarMetricas(pAnterior.desde, pAnterior.hasta, pedidosRaw, movimientosCaja, false, mermasRaw, deudoresRaw, turnosRaw, averiasRaw, categoriasClienteRaw);

    setComparacionData({
      actual: metricasActuales,
      anterior: metricasAnteriores,
      periodoActual: pActual,
      periodoAnterior: pAnterior,
    });
  };

  return {
    modalComparacionAbierto,
    informeComparacion,
    tipoComparacion,
    comparacionData,
    errorRangoComparacion,
    modalFechaDesdeInput,
    modalFechaHastaInput,
    modalFechaDesdeCompInput,
    modalFechaHastaCompInput,
    setModalFechaDesdeInput,
    setModalFechaHastaInput,
    setModalFechaDesdeCompInput,
    setModalFechaHastaCompInput,
    obtenerNombreInforme,
    abrirModalComparacion,
    cerrarModalComparacion,
    handleAnalizarComparacionModal,
    seleccionarTipoComparacion,
  };
}
