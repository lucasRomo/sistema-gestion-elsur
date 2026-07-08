import { useState, useEffect } from 'react';

export const usePedidosPendientes = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
  try {
    const resp = await fetch('http://localhost:8080/api/pedidos');
    if (resp.ok) {
      const data = await resp.json();
      
      // Filtramos para que EXCLUYA las ventas rápidas
      // Usamos .filter para que solo pasen los estados "PENDIENTE", "EN PROCESO", etc.
      const pedidosFiltrados = data.filter((p: any) => 
        p.estado !== 'VENTA_RAPIDA' && p.estado !== 'ENTREGADO' 
      );
      
      setPedidos(pedidosFiltrados);
    }
  } catch (error) {
    console.error("Error al cargar pedidos", error);
  } finally {
    setCargando(false);
  }
};

  useEffect(() => {
    cargarPedidos();
  }, []);


  const actualizarEstado = async (idPedido: number, nuevoEstado: string, estadoAnterior: string, observaciones: string, idUsuario: number) => {
  try {
    const resp = await fetch(`http://localhost:8080/api/pedidos/${idPedido}/cambiar-estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado, observaciones, idUsuario })
    });

    if (resp.ok) {
      const pedidoActualizado = await resp.json();
      
      // Lógica de actualización:
      // Si el estado es ENTREGADO, lo quitamos de la lista.
      // Si es otro estado (ej: EN PROCESO), lo mantenemos actualizado.
      if (nuevoEstado === 'ENTREGADO') {
        setPedidos(prev => prev.filter(p => p.id_pedido !== idPedido));
      } else {
        setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? pedidoActualizado : p));
      }
      
    } else {
      const errText = await resp.text();
      console.error("Error de servidor:", errText);
    }
  } catch (error) {
    console.error(error);
  }
};

  const registrarPago = async (idPedido: number, tipoPago: string, monto: number, urlComprobante: string) => {
    try {
      const resp = await fetch(`http://localhost:8080/api/pedidos/${idPedido}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto, tipoPago, urlComprobante })
      });

      if (resp.ok) {
        const pedidoActualizado = await resp.json();
        // ➔ CLAVE: Reemplaza el pedido viejo por el que viene del backend con los saldos actualizados
        setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? pedidoActualizado : p));
      } else {
        alert("Error al procesar el pago en el servidor.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { pedidos, cargando, actualizarEstado, registrarPago, refrescar: cargarPedidos };
};