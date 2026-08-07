import { useState, useEffect } from 'react';

export const usePedidosPendientes = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    try {
      const resp = await fetch('http://localhost:8080/api/pedidos');
      if (resp.ok) {
        const data = await resp.json();
        
        // ➔ SOLUCIÓN 1: Excluimos VENTA_RAPIDA, ENTREGADO, CANCELADO y DEVUELTO
        const pedidosFiltrados = data.filter((p: any) => 
          p.estado !== 'VENTA_RAPIDA' && 
          p.estado !== 'ENTREGADO' && 
          p.estado !== 'CANCELADO' && 
          p.estado !== 'DEVUELTO'
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

  const subirArchivo = async (idPedido: number, file: File) => {
    const pedido = pedidos.find(p => p.id_pedido === idPedido);
    const esSeña = !pedido?.comprobantes || pedido.comprobantes.length === 0;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('esSeña', esSeña.toString());

    await fetch(`http://localhost:8080/api/comprobantes/${idPedido}/comprobante`, {
      method: 'POST',
      body: formData
    });
    
    await cargarPedidos(); 
  };

  const actualizarEstado = async (idPedido: number, nuevoEstado: string, estadoAnterior: string, observaciones: string, idUsuario: number) => {
    try {
      const resp = await fetch(`http://localhost:8080/api/pedidos/${idPedido}/cambiar-estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado, observaciones, idUsuario })
      });

      if (resp.ok) {
        const pedidoActualizado = await resp.json();
        
        // ➔ SOLUCIÓN 2: Si pasa a ser ENTREGADO, CANCELADO o DEVUELTO, lo quitamos de la cola de trabajo
        const estadosFinalizados = ['ENTREGADO', 'CANCELADO', 'DEVUELTO'];
        
        if (estadosFinalizados.includes(nuevoEstado)) {
          setPedidos(prev => prev.filter(p => p.id_pedido !== idPedido));
        } else {
          setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? pedidoActualizado : p));
        }
        
      } else {
        const errText = await resp.text();
        console.error("Error de servidor:", errText);
        throw new Error(errText);
      }
    } catch (error: any) {
      console.error("Error en actualizar Estado hook:", error);
      throw error;
    }
  };

  const registrarPago = async (idPedido: number, tipoPago: string, monto: number, urlComprobante: string) => {
    const idUsuarioLogueado = 1;

    try {
      const url = `http://localhost:8080/api/pedidos/${idPedido}/pagos`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          monto: monto,
          tipoPago: tipoPago,
          urlComprobante: urlComprobante || "",
          idUsuario: idUsuarioLogueado
        })
      });

      const data = await resp.text();

      if (resp.ok) {
        const pedidoActualizado = JSON.parse(data);
        setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? pedidoActualizado : p));
      } else {
        throw new Error(data || "Error al registrar el pago.");
      }
    } catch (error: any) {
      throw error;
    }
  };

  return { pedidos, cargando, actualizarEstado, registrarPago, refrescar: cargarPedidos };
};