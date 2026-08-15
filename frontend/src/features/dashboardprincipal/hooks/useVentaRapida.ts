import { useState, useEffect } from 'react';
import type { Producto } from '../../productos/types/Producto';
import type { CartItem } from '../../pedidos/types/Pedido';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';

const API_BASE = 'http://localhost:8080/api';

export const useVentaRapida = () => {
  // --- ESTADOS DE DATOS / CATÁLOGOS ---
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  // --- ESTADOS DE FORMULARIO Y CARRITO ---
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // --- ESTADOS DE MODALES Y NOTIFICACIONES ---
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [suceso, setSuceso] = useState({ show: false, titulo: '', mensaje: '', tipo: 'exito' });
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

  // --- RECUPERAR ÚLTIMO PEDIDO DE LOCALSTORAGE ---
  const [ultimoPedidoRealizado, setUltimoPedidoRealizado] = useState<any | null>(() => {
    const guardado = localStorage.getItem('ultimo_pedido_venta_rapida');
    return guardado ? JSON.parse(guardado) : null;
  });

  // Soporta null u objeto con { pedido: any, tipo: 'cliente' | 'pago' }
  const [verTicketPedido, setVerTicketPedido] = useState<{ pedido: any; tipo: 'cliente' | 'pago' } | null>(null);

  // --- PETICIONES A LA API (FETCHING) ---
  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_BASE}/productos`);
      if (response.ok) {
        const data = await response.json();
        setProductosDisponibles(data.filter((p: Producto) => p.estado === 'Activo'));
      }
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE}/categorias-cliente`);
      if (response.ok) {
        const data = await response.json();
        const categoriasNormalizadas = data.map((cat: any) => ({
          idCategoriaCliente: cat.idCategoria ?? cat.id_categoria ?? cat.idCategoriaCliente ?? cat.id,
          nombreCategoria: cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Sin nombre',
          porcentajeDescuento: cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.porcentajeDescuento ?? cat.descuento ?? 0
        }));
        setCategorias(categoriasNormalizadas);
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const fetchMaquinas = async () => {
    try {
      const response = await fetch(`${API_BASE}/maquinas`);
      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Error al obtener máquinas:', error);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchMaquinas();
  }, []);

  // --- ACCIONES DEL CARRITO ---
  const handleAgregar = () => {
    if (!productoSeleccionado || !cantidad || parseInt(cantidad) <= 0) return;
    const producto = productosDisponibles.find((p) => p.idProducto?.toString() === productoSeleccionado);
    if (!producto) return;

    const qty = parseInt(cantidad);
    setCarrito((prev) => [...prev, { producto, cantidad: qty, subtotal: producto.precioBase * qty }]);
    setProductoSeleccionado('');
    setCantidad('1');
  };

  const handleEliminarItem = (index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setProductoSeleccionado('');
    setCategoriaSeleccionadaId('');
    setCantidad('1');
  };

  // --- CÁLCULOS DE MONTO Y DESCUENTO ---
  const subtotalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0);

  const categoriaActual = categorias.find((c) => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentajeDescuento = categoriaActual
    ? (categoriaActual.porcentajeDescuento ?? (categoriaActual as any).descuentoAutomatico ?? (categoriaActual as any).descuento_automatico ?? 0)
    : 0;

  const montoDescuento = (subtotalVenta * porcentajeDescuento) / 100;
  const totalFinal = subtotalVenta - montoDescuento;

  // --- VALIDACIÓN DE MAQUINARIA FUERA DE SERVICIO ---
  const handleValidarYCompletarVenta = () => {
    if (carrito.length === 0) {
      setSuceso({
        show: true,
        titulo: 'Carrito vacío',
        mensaje: 'Debes agregar al menos un producto antes de completar la venta.',
        tipo: 'error'
      });
      return;
    }

    const conflictos: { productoNombre: string; maquinaNombre: string; estado: string }[] = [];

    carrito.forEach((item) => {
      const prod = item.producto as any;
      if (!prod) return;

      const maquinaAsociada = prod.maquinaNecesaria || prod.maquina || prod.maquinaAsociada;
      const maquinaId = maquinaAsociada?.idMaquina ?? maquinaAsociada?.id ?? prod.idMaquina;

      let maquinaObj: any = undefined;
      if (maquinaId !== undefined && maquinaId !== null && maquinas.length > 0) {
        maquinaObj = maquinas.find((m) => String(m.idMaquina) === String(maquinaId));
      }

      if (!maquinaObj) maquinaObj = maquinaAsociada;
      if (!maquinaObj) return;

      const nombreMaquina = (maquinaObj.nombre || maquinaObj.nombreMaquina || '').trim();
      const estadoRaw = (maquinaObj.estado || '').trim().toUpperCase();
      const estadoNormalizado = estadoRaw.replace(/_/g, ' ');

      if (!nombreMaquina || nombreMaquina.toLowerCase().includes('no aplica')) return;

      if (
        estadoNormalizado.includes('FUERA DE SERVICIO') ||
        estadoNormalizado.includes('FALLA') ||
        estadoNormalizado.includes('MANTENIMIENTO')
      ) {
        conflictos.push({
          productoNombre: prod.nombreProducto || prod.nombre || 'Producto sin nombre',
          maquinaNombre: nombreMaquina,
          estado: estadoRaw
        });
      }
    });

    if (conflictos.length > 0) {
      setConflictosMaquinas(conflictos);
      setShowModalMaquinas(true);
    } else {
      ejecutarCompletarVenta();
    }
  };

  // --- REGISTRO Y COMPLETADO DE VENTA EN 3 PASOS ---
  const ejecutarCompletarVenta = async () => {
    const idUsuarioLogueado = (() => {
      const usuarioJson = localStorage.getItem('usuario_logueado');
      if (usuarioJson) {
        try {
          const usuarioObj = JSON.parse(usuarioJson);
          return usuarioObj.idUsuario ? parseInt(usuarioObj.idUsuario) : null;
        } catch (e) {
          console.error('Error al parsear el usuario_logueado desde localStorage:', e);
        }
      }
      return null;
    })();

    const idUsuario = idUsuarioLogueado || 1;
    const fechaActualIso = new Date().toISOString().slice(0, 19);

    const payloadParaBackend = {
      pedido: {
        cliente: { id_cliente: 1 },
        fecha_entrega_estimada: fechaActualIso,
        monto_total: totalFinal,
        monto_pago_adelantado: totalFinal, // Sincronizado con la rama Lucas
        es_cuenta_corriente: false,
        es_presupuesto: false,
        observaciones: `Venta Rápida ${porcentajeDescuento > 0 ? `(Categoría: ${categoriaActual?.nombreCategoria} - ${porcentajeDescuento}% Desc.)` : ''}`,
        detalles: carrito.map((item) => ({
          producto: { idProducto: item.producto.idProducto },
          cantidad: item.cantidad,
          precioUnitario: item.producto.precioBase,
          subtotal: item.subtotal
        }))
      },
      idEmpleado: idUsuario,
      idUsuario: idUsuario,
      tipoPago: 'EFECTIVO'
    };

    try {
      // 1. Crear el Pedido
      const resCrear = await fetch(`${API_BASE}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadParaBackend)
      });

      if (!resCrear.ok) throw new Error(await resCrear.text());

      const pedidoGuardado = await resCrear.json();
      const idPedido = pedidoGuardado.id_pedido || pedidoGuardado.idPedido;

      await new Promise((resolve) => setTimeout(resolve, 300));

      // 2. Registrar el Pago en Caja
      const formDataPago = new FormData();
      formDataPago.append(
        'payload',
        JSON.stringify({
          monto: totalFinal,
          tipoPago: 'EFECTIVO',
          idUsuario: idUsuario
        })
      );

      const resPago = await fetch(`${API_BASE}/pedidos/${idPedido}/pagos`, {
        method: 'POST',
        body: formDataPago
      });

      if (!resPago.ok) {
        const errorText = await resPago.text();
        throw new Error(errorText || 'Error al registrar el cobro en el sistema de caja.');
      }

      // 3. Cambiar el estado a FINALIZADO
      const resEstado = await fetch(`${API_BASE}/pedidos/${idPedido}/cambiar-estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado: 'FINALIZADO',
          observaciones: `Venta Rápida ${porcentajeDescuento > 0 ? `(Categoría: ${categoriaActual?.nombreCategoria} - ${porcentajeDescuento}% Desc.)` : ''}`,
          idUsuario: idUsuario
        })
      });

      if (!resEstado.ok) {
        const errorText = await resEstado.text();
        throw new Error(errorText || 'Error al actualizar estado del pedido.');
      }

      // 4. Refrescar catálogo para actualizar el stock descontado
      await fetchProductos();

      // Construcción del objeto enriquecido para tickets inmediatos (Rama Lucas)
      const pedidoParaTicket = {
        ...pedidoGuardado,
        monto_pago_adelantado: totalFinal,
        monto_total: totalFinal,
        estado: 'FINALIZADO'
      };

      setUltimoPedidoRealizado(pedidoParaTicket);
      localStorage.setItem('ultimo_pedido_venta_rapida', JSON.stringify(pedidoParaTicket));

      vaciarCarrito();
      setSuceso({
        show: true,
        titulo: '¡Éxito!',
        mensaje: `Venta realizada con éxito ($${totalFinal.toFixed(2)}), registrada en Caja y stock descontado.`,
        tipo: 'exito'
      });
    } catch (error: any) {
      console.error('Error en la venta:', error.message);
      setSuceso({
        show: true,
        titulo: 'Algo ha ido mal',
        mensaje: error.message || 'No se pudo completar la venta.',
        tipo: 'error'
      });
    }
  };

  const ejecutarCancelacion = () => {
    vaciarCarrito();
    setConfirmarCancelacion(false);
    setSuceso({
      show: true,
      titulo: '¡Cancelado!',
      mensaje: 'El carrito ha sido borrado con éxito.',
      tipo: 'exito'
    });
  };

  return {
    // Datos y estados de entradas
    productosDisponibles,
    categorias,
    productoSeleccionado,
    setProductoSeleccionado,
    cantidad,
    setCantidad,
    categoriaSeleccionadaId,
    setCategoriaSeleccionadaId,
    carrito,
    
    // Totales calculados
    subtotalVenta,
    montoDescuento,
    totalFinal,

    // Modales y avisos
    confirmarCancelacion,
    setConfirmarCancelacion,
    suceso,
    setSuceso,
    showModalMaquinas,
    setShowModalMaquinas,
    conflictosMaquinas,
    ultimoPedidoRealizado,
    verTicketPedido,
    setVerTicketPedido,

    // Handlers
    handleAgregar,
    handleEliminarItem,
    handleValidarYCompletarVenta,
    ejecutarCompletarVenta,
    ejecutarCancelacion
  };
};