import { useState, useEffect, useCallback } from 'react';
import { pedidoService } from '../../pedidos/general/service/pedidoService'; 
import { getInsumosBajoStock } from '../../insumos/services/insumoService';
import { cajaService } from '../../caja/services/cajaService';
import { incidenciaService } from '../../maquinas/service/incidenciaService';
import type { Maquina } from '../../maquinas/types/Maquina';
import { fetchMaquinas } from '../../maquinas/service/maquinasService';
import type { NotificacionItem } from '../types/Notificaciones';

const ESTADOS_FINALES = ['ENTREGADO', 'FINALIZADO', 'VENTA_RAPIDA'];

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [pedidos, insumosBajoStock, movimientosDia, maquinas] = await Promise.all([
        pedidoService.obtenerTodos().catch(() => []),
        getInsumosBajoStock().catch(() => []),
        cajaService.obtenerMovimientosDia().catch(() => []),
        fetchMaquinas().catch(() => [] as Maquina[]),
      ]);

      const items: NotificacionItem[] = [];
      const ahora = new Date();

      // --- Pedidos: demorados y pendientes ---
      pedidos.forEach((p: any) => {
        if (ESTADOS_FINALES.includes(p.estado)) return;

        const fechaEstimada = p.fecha_entrega_estimada ? new Date(p.fecha_entrega_estimada) : null;
        const esDemorado = fechaEstimada && fechaEstimada < ahora;

        const nombreCliente =
          p.cliente?.razon_social ||
          p.cliente?.nombre ||
          `${p.cliente?.persona?.nombre ?? ''} ${p.cliente?.persona?.apellido ?? ''}`.trim() ||
          'Consumidor Final';

        items.push({
          id: `pedido-${p.id_pedido}`,
          tipo: esDemorado ? 'PEDIDO_DEMORADO' : 'PEDIDO_PENDIENTE',
          titulo: esDemorado ? `Pedido #${p.id_pedido} demorado` : `Pedido #${p.id_pedido} pendiente`,
          descripcion: `Cliente: ${nombreCliente} — Entrega estimada: ${
            fechaEstimada ? fechaEstimada.toLocaleString() : 'sin definir'
          }`,
          fecha: p.fecha_entrega_estimada || p.fecha_creacion,
          icono: esDemorado ? 'bi-alarm-fill' : 'bi-hourglass-split',
          color: esDemorado ? 'danger' : 'warning',
        });
      });

      // --- Stock bajo ---
      insumosBajoStock.forEach((i: any) => {
        items.push({
          id: `stock-${i.idInsumo}`,
          tipo: 'STOCK_BAJO',
          titulo: `Stock bajo: ${i.nombreInsumo}`,
          descripcion: `Actual: ${i.stockActual} — Mínimo: ${i.stockMinimo}`,
          fecha: new Date().toISOString(),
          icono: 'bi-box-seam',
          color: 'warning',
        });
      });

      // --- Movimientos de caja del día ---
      movimientosDia.forEach((m: any) => {
        items.push({
          id: `caja-${m.idMovimiento || m.id_movimiento}`,
          tipo: 'MOVIMIENTO_CAJA',
          titulo: `${m.tipoMovimiento === 'INGRESO' ? 'Ingreso' : 'Egreso'}: $${m.monto}`,
          descripcion: m.descripcion,
          fecha: m.fecha,
          icono: m.tipoMovimiento === 'INGRESO' ? 'bi-cash-coin' : 'bi-cash-stack',
          color: m.tipoMovimiento === 'INGRESO' ? 'success' : 'info',
        });
      });

      // --- Fallas de máquina (recorriendo máquinas no operativas) ---
      const maquinasConProblema = maquinas.filter((m: Maquina) => m.estado !== 'OPERATIVA');
      const incidenciasPorMaquina = await Promise.all(
        maquinasConProblema.map((m) =>
          m.idMaquina ? incidenciaService.getByMaquinaId(m.idMaquina).catch(() => []) : []
        )
      );
      incidenciasPorMaquina.flat().forEach((inc: any) => {
        if (inc.estadoIncidencia === 'RESUELTA') return;
        items.push({
          id: `falla-${inc.idIncidencia}`,
          tipo: 'FALLA_MAQUINA',
          titulo: `Falla reportada: ${inc.prioridad || 'MEDIA'}`,
          descripcion: inc.descripcion,
          fecha: inc.fechaReporte,
          icono: 'bi-exclamation-triangle-fill',
          color: inc.prioridad === 'CRITICA' || inc.prioridad === 'ALTA' ? 'danger' : 'warning',
        });
      });

      items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setNotificaciones(items);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { notificaciones, cargando, recargar: cargar };
};