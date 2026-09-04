import { useState, useEffect } from 'react';
import { PedidoPendienteService } from '../service/pedidoPendienteService';

export const usePedidosPendientes = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    try {
      const data = await PedidoPendienteService.obtenerTodos();
      
      // Excluimos VENTA_RAPIDA, ENTREGADO, CANCELADO y DEVUELTO
      const pedidosFiltrados = data.filter((p: any) => 
        p.estado !== 'VENTA_RAPIDA' && 
        p.estado !== 'ENTREGADO' && 
        p.estado !== 'CANCELADO' && 
        p.estado !== 'DEVUELTO'
      );
      
      setPedidos(pedidosFiltrados);
    } catch (error) {
      console.error("Error al cargar pedidos", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const subirArchivo = async (idPedido: number, file: File) => {
    await PedidoPendienteService.subirComprobanteFisico(idPedido, file);
    await cargarPedidos(); 
  };

  const actualizarEstado = async (
    idPedido: number, 
    nuevoEstado: string, 
    estadoAnterior: string, 
    observaciones: string, 
    idUsuario: number
  ) => {
    try {
      const pedidoActualizado = await PedidoPendienteService.cambiarEstado(
        idPedido, 
        nuevoEstado, 
        observaciones, 
        idUsuario
      );
      
      const estadosFinalizados = ['ENTREGADO', 'CANCELADO', 'DEVUELTO'];
      
      if (estadosFinalizados.includes(nuevoEstado)) {
        setPedidos(prev => prev.filter(p => (p.id_pedido || p.idPedido) !== idPedido));
      } else {
        setPedidos(prev => prev.map(p => (p.id_pedido || p.idPedido) === idPedido ? pedidoActualizado : p));
      }
    } catch (error: any) {
      console.error("Error en actualizar Estado hook:", error);
      throw error;
    }
  };

  const registrarPago = async (
    idPedido: number, 
    tipoPago: string, 
    monto: number, 
    archivo: File | null = null
  ) => {
    const idUsuarioLogueado = 1;

    try {
      const pedidoActualizado = await PedidoPendienteService.registrarPago(
        idPedido,
        monto,
        tipoPago,
        idUsuarioLogueado,
        archivo
      );

      setPedidos(prev => prev.map(p => (p.id_pedido || p.idPedido) === idPedido ? pedidoActualizado : p));
    } catch (error: any) {
      throw error;
    }
  };

  return { 
    pedidos, 
    cargando, 
    actualizarEstado, 
    registrarPago, 
    subirArchivo,
    refrescar: cargarPedidos 
  };
};