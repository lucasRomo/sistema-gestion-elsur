import { useCallback, useState } from 'react';
import {
  procesarMetricas as procesarMetricasInforme,
  calcularIncongruenciasArqueo,
} from '../utils/informesUtils';

const METRICAS_INICIALES: any = {
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
  topClientes: [],
};

export function useMetricasInforme() {
  const [metricas, setMetricas] = useState<any>(METRICAS_INICIALES);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [incongruenciasArqueo, setIncongruenciasArqueo] = useState<any[]>([]);

  const procesarMetricas = useCallback((
    fDesde: string,
    fHasta: string,
    pedidosLista: any[] = [],
    cajaLista: any[] = [],
    actualizarEstado = true,
    mermasListaParam: any[] = [],
    deudoresListaParam: any[] = [],
    turnosListaParam: any[] = [],
    averiasListaParam: any[] = [],
    categoriasListaParam: any[] = []
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
  }, []);

  return { metricas, topClientes, incongruenciasArqueo, procesarMetricas };
}
