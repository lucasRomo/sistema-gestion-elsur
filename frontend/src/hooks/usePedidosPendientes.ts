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


  const subirArchivo = async (idPedido: number, file: File) => {
  // Obtenemos el pedido actual del estado para ver si ya tiene comprobantes
  const pedido = pedidos.find(p => p.id_pedido === idPedido);
  const esSeña = !pedido?.comprobantes || pedido.comprobantes.length === 0;

  const formData = new FormData();
  formData.append('archivo', file);
  // Opcional: Si quieres guardar en BD que es seña, puedes enviar un flag
  formData.append('esSeña', esSeña.toString());

  await fetch(`http://localhost:8080/api/comprobantes/${idPedido}/comprobante`, {
    method: 'POST',
    body: formData
  });
  
  // Refrescar lista de pedidos para que el botón cambie a 📁 al tener seña
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
      
      // Lógica de actualización:
      // Si el estado es ENTREGADO, lo quitamos de la lista.
      // Si es otro estado (ej: EN PROCESO), lo mantenemos actualizado.
      if (nuevoEstado === 'ENTREGADO') {
        setPedidos(prev => prev.filter(p => p.id_pedido !== idPedido));
      } else {
        setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? pedidoActualizado : p));
      }
      
    } else {
        // ➔ MODIFICADO: Extraemos el mensaje textual enviado por Spring Boot (ej: "Falta stock...")
        const errText = await resp.text();
        console.error("Error de servidor:", errText);
        
        // ➔ CLAVE: Lanzamos el error hacia la vista para que el catch del componente lo capture
        throw new Error(errText);
      }
    } catch (error: any) {
      console.error("Error en actualizar Estado hook:", error);
      // ➔ CLAVE: Si es un error de red o el relanzado de arriba, lo arrojamos hacia afuera
      throw error;
    }
  };

  const registrarPago = async (idPedido: number, tipoPago: string, monto: number, urlComprobante: string) => {
  const idUsuarioLogueado = 1;

  try {
    // 1. URL limpia (sin los parámetros ?monto=...)
    const url = `http://localhost:8080/api/pedidos/${idPedido}/pagos`;
    
    // 2. Fetch con el cuerpo (Body) en formato JSON
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
      // Si el backend dice "Caja Cerrada", el error vendrá aquí
      throw new Error(data || "Error al registrar el pago.");
    }
  } catch (error: any) {
    throw error;
  }
  };

  return { pedidos, cargando, actualizarEstado, registrarPago, refrescar: cargarPedidos };
};

