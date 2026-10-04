import { useState, useEffect } from 'react';
import { PedidoPendienteService } from '../service/pedidoPendienteService';

const ESTADOS_FUERA_DE_COLA = ['VENTA_RAPIDA', 'ENTREGADO', 'CANCELADO', 'DEVUELTO'];

const esPedidoActivo = (p: any) => !ESTADOS_FUERA_DE_COLA.includes(p?.estado);
const idDe = (p: any): number => p?.id_pedido ?? p?.idPedido;

export const usePedidosPendientes = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pedidosActualizando, setPedidosActualizando] = useState<Set<number>>(new Set());

  const cargarPedidos = async () => {
    try {
      const data = await PedidoPendienteService.obtenerActivos();
      setPedidos(data.filter(esPedidoActivo));
    } catch (error) {
      console.error("Error al cargar pedidos", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  // Recarga solo el pedido indicado (mucho más rápido que traer la lista
  // completa) y marca su tarjeta como "actualizando" mientras tanto, para que
  // la línea de tiempo muestre un spinner en vez de datos viejos.
  const refrescarPedido = async (idPedido: number) => {
    setPedidosActualizando(prev => new Set(prev).add(idPedido));
    try {
      const actualizado = await PedidoPendienteService.obtenerPorId(idPedido);
      setPedidos(prev => {
        if (!esPedidoActivo(actualizado)) {
          return prev.filter(p => idDe(p) !== idPedido);
        }
        const existe = prev.some(p => idDe(p) === idPedido);
        return existe
          ? prev.map(p => (idDe(p) === idPedido ? actualizado : p))
          : [...prev, actualizado];
      });
    } catch (error) {
      console.error(`Error al refrescar el pedido #${idPedido}`, error);
      await cargarPedidos();
    } finally {
      setPedidosActualizando(prev => {
        const siguiente = new Set(prev);
        siguiente.delete(idPedido);
        return siguiente;
      });
    }
  };

  const actualizarEstado = async (
    idPedido: number,
    nuevoEstado: string,
    _estadoAnterior: string,
    observaciones: string,
    idUsuario: number
  ) => {
    await PedidoPendienteService.cambiarEstado(idPedido, nuevoEstado, observaciones, idUsuario);
  };

  return {
    pedidos,
    cargando,
    pedidosActualizando,
    actualizarEstado,
    refrescar: cargarPedidos,
    refrescarPedido
  };
};
