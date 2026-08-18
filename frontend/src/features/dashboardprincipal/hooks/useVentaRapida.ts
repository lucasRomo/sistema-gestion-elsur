import { useState, useEffect } from 'react';
import type { Producto } from '../../productos/types/Producto';
import type { CartItem, Pedido } from '../../pedidos/types/Pedido';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';

const API_BASE = 'http://localhost:8080/api';

export const useVentaRapida = () => {
  // --- ESTADOS DE DATOS / CATÁLOGOS ---
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);

  // --- ESTADOS DE FORMULARIO Y CARRITO ---
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // --- ESTADOS DE MODALES Y NOTIFICACIONES ---
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [suceso, setSuceso] = useState({ show: false, titulo: '', mensaje: '', tipo: 'exito' });
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [showModalMetodoPago, setShowModalMetodoPago] = useState(false);
  const [showModalStockCritico, setShowModalStockCritico] = useState(false);
  const [insumosCatalogo, setInsumosCatalogo] = useState<any[]>([]);



  const fetchInsumos = async () => {
    try {
      const response = await fetch(`${API_BASE}/insumos`);
      if (response.ok) {
        const data = await response.json();
        setInsumosCatalogo(data);
      }
    } catch (error) {
      console.error('Error al obtener insumos:', error);
    }
  };

  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

  const [conflictosStockCritico, setConflictosStockCritico] = useState<{
    nombre: string;
    tipo: string;
    quedaran: number;
    tolerancia: number;
  }[]>([]);

  // --- RECUPERAR ÚLTIMO PEDIDO DE LOCALSTORAGE ---
  const [ultimoPedidoRealizado, setUltimoPedidoRealizado] = useState<any | null>(() => {
    const guardado = localStorage.getItem('ultimo_pedido_venta_rapida');
    return guardado ? JSON.parse(guardado) : null;
  });
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

  const fetchPedidosPendientes = async () => {
    try {
      const response = await fetch(`${API_BASE}/pedidos`);
      if (response.ok) {
        const data = await response.json();
        const activos = data.filter((p: any) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO');
        setPedidosPendientes(activos);
      }
    } catch (error) {
      console.error('Error al obtener pedidos pendientes:', error);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchMaquinas();
    fetchPedidosPendientes();
    fetchInsumos();
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

  // --- VALIDACIÓN DE STOCK Y MAQUINARIA AL INTENTAR COMPLETAR LA VENTA ---
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

    const MARGEN_MERMA = 5;

    // 1. MAPEAR CONSUMOS DEL CARRITO Y CRUZAR CON CATÁLOGO DE INSUMOS
    const requerimientoMapa = new Map<string, {
      nombre: string;
      tipo: string;
      cantReq: number;
      stockActual: number;
      stockMinimo: number;
      unidad: string;
    }>();

    carrito.forEach((item) => {
      const prod = item.producto as any;
      if (!prod) return;

      const insumos = prod.insumos || prod.productoInsumos || prod.receta || [];

      // A) SI EL PRODUCTO TIENE RECETA / INSUMOS ASOCIADOS
      if (Array.isArray(insumos) && insumos.length > 0) {
        insumos.forEach((pi: any) => {
          const insumoRaw = pi.insumo || pi;
          const idInsumo = insumoRaw.idInsumo ?? insumoRaw.id_insumo ?? insumoRaw.id;
          const key = `INS_${idInsumo}`;
          
          // Buscar el insumo fresco de /api/insumos
          const insumoActualizado = insumosCatalogo.find((i) => 
            String(i.idInsumo ?? i.id_insumo ?? i.id) === String(idInsumo)
          ) || insumoRaw;

          const proporcion = Number(pi.cantidadProporcion ?? pi.cantidad_proporcion ?? pi.cantidad ?? 1);
          const cantTotalInsumo = proporcion * item.cantidad;

          const stockReal = Number(
            insumoActualizado.stockActual ?? 
            insumoActualizado.stock_actual ?? 
            insumoActualizado.stockSuelto ?? 
            insumoActualizado.stock_suelto ?? 
            insumoActualizado.stock ?? 0
          );

          const stockMin = Number(
            insumoActualizado.stockMinimo ?? 
            insumoActualizado.stock_minimo ?? 0
          );

          // Formatear nombre de unidad (manejando si viene como string o como objeto JSON)
          const unidadNom = typeof insumoActualizado.unidadMedida === 'object' 
            ? insumoActualizado.unidadMedida?.nombre 
            : (insumoActualizado.unidadMedida || 'Unidad');

          if (!requerimientoMapa.has(key)) {
            requerimientoMapa.set(key, {
              nombre: insumoActualizado.nombreInsumo || insumoActualizado.nombre_insumo || insumoActualizado.nombre || 'Insumo',
              tipo: 'Insumo',
              cantReq: cantTotalInsumo,
              stockActual: stockReal,
              stockMinimo: stockMin,
              unidad: unidadNom || 'Unidad',
            });
          } else {
            requerimientoMapa.get(key)!.cantReq += cantTotalInsumo;
          }
        });
      } 
      // B) SI EL PRODUCTO ES DE VENTA DIRECTA (O UN INSUMO VENDIDO DIRECTAMENTE COMO PRODUCTO)
      else {
        const idProd = prod.idProducto || prod.id_producto || prod.id;
        
        // Verificar si este producto directo existe también en la tabla de insumos por coincidencia de ID o nombre
        const insumoCoincidente = insumosCatalogo.find((i) => 
          String(i.idInsumo ?? i.id) === String(idProd) ||
          (i.nombreInsumo && prod.nombreProducto && i.nombreInsumo.toLowerCase() === prod.nombreProducto.toLowerCase())
        );

        const key = insumoCoincidente ? `INS_${insumoCoincidente.idInsumo}` : `PROD_${idProd}`;
        const cantProd = item.cantidad;

        // Si encontramos el insumo en el catálogo, tomar su stockActual y stockMinimo reales de la tabla insumos
        const stockReal = insumoCoincidente 
          ? Number(insumoCoincidente.stockActual ?? insumoCoincidente.stockSuelto ?? 0)
          : Number(prod.stockActual ?? prod.stock_actual ?? prod.stock ?? 0);

        const stockMin = insumoCoincidente
          ? Number(insumoCoincidente.stockMinimo ?? 0)
          : Number(prod.stockMinimo ?? prod.stock_minimo ?? 0);

        const unidadNom = insumoCoincidente
          ? (typeof insumoCoincidente.unidadMedida === 'object' ? insumoCoincidente.unidadMedida?.nombre : insumoCoincidente.unidadMedida)
          : 'Unidad';

        if (!requerimientoMapa.has(key)) {
          requerimientoMapa.set(key, {
            nombre: prod.nombreProducto || prod.nombre || 'Producto Directo',
            tipo: insumoCoincidente ? 'Insumo' : 'Producto Directo',
            cantReq: cantProd,
            stockActual: stockReal,
            stockMinimo: stockMin,
            unidad: unidadNom || 'Unidad',
          });
        } else {
          requerimientoMapa.get(key)!.cantReq += cantProd;
        }
      }
    });

    // 2. VALIDACIÓN DE BLOQUEO (STOCK TOTALMENTE INSUFICIENTE PARA COMPLETAR)
    for (const [, item] of requerimientoMapa) {
      if (item.stockActual < item.cantReq) {
        const faltante = item.cantReq - item.stockActual;
        setSuceso({
          show: true,
          titulo: 'Stock Insuficiente',
          mensaje: `No hay stock suficiente para "${item.nombre}". Faltan ${faltante} ${item.unidad}(s) para completar este pedido.`,
          tipo: 'error',
        });
        return;
      }
    }

    // 3. VALIDACIÓN DE ADVERTENCIA (STOCK RESTANTE EN NIVEL CRÍTICO / MÍNIMO)
    const criticos: { nombre: string; tipo: string; quedaran: number; tolerancia: number }[] = [];

    for (const [, item] of requerimientoMapa) {
      const saldoRestante = item.stockActual - item.cantReq;
      
      // La tolerancia es el Stock Mínimo registrado en la BD + los 5 de margen
      const toleranciaRef = item.stockMinimo + MARGEN_MERMA;

      // Si el saldo resultante cae dentro del margen de tolerancia o lo supera hacia abajo
      if (saldoRestante <= toleranciaRef) {
        criticos.push({
          nombre: item.nombre,
          tipo: item.tipo,
          quedaran: saldoRestante,
          tolerancia: toleranciaRef,
        });
      }
    }

    if (criticos.length > 0) {
      setConflictosStockCritico(criticos);
      setShowModalStockCritico(true);
      return;
    }

    // 4. CONTINUAR CON EVALUACIÓN DE MÁQUINAS Y PAGO
    continuarFlujoPostStock();
  };

  const continuarFlujoPostStock = () => {
    setShowModalStockCritico(false);

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
      setShowModalMetodoPago(true);
    }
  };

  // --- REGISTRO Y COMPLETADO DE VENTA CON MÉTODO DE PAGO Y COMPROBANTE ---
  const ejecutarCompletarVenta = async (datosPago?: {
    tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CUENTA_CORRIENTE';
    idCliente?: number;
    comprobanteFile?: File | null;
  }) => {
    const tipoPagoElegido = datosPago?.tipoPago || 'EFECTIVO';
    const esCuentaCorriente = tipoPagoElegido === 'CUENTA_CORRIENTE';
    const idClienteAsignado = esCuentaCorriente && datosPago?.idCliente ? datosPago.idCliente : 1;
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
        cliente: { id_cliente: idClienteAsignado },
        fecha_entrega_estimada: fechaActualIso,
        monto_total: totalFinal,
        monto_pago_adelantado: esCuentaCorriente ? 0 : totalFinal,
        es_cuenta_corriente: esCuentaCorriente,
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
      tipoPago: tipoPagoElegido
    };

    try {
      let resCrear: Response;
      if (datosPago?.comprobanteFile) {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payloadParaBackend));
        formData.append('comprobante', datosPago.comprobanteFile);

        resCrear = await fetch(`${API_BASE}/pedidos`, {
          method: 'POST',
          body: formData
        });
      } else {
        resCrear = await fetch(`${API_BASE}/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadParaBackend)
        });
      }

      if (!resCrear.ok) throw new Error(await resCrear.text());

      const pedidoGuardado = await resCrear.json();
      const idPedido = pedidoGuardado.id_pedido || pedidoGuardado.idPedido;

      await new Promise((resolve) => setTimeout(resolve, 300));

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

      await fetchProductos();
      await fetchPedidosPendientes();

      const pedidoParaTicket = {
        ...pedidoGuardado,
        monto_pago_adelantado: esCuentaCorriente ? 0 : totalFinal,
        monto_total: totalFinal,
        estado: 'FINALIZADO'
      };
      setUltimoPedidoRealizado(pedidoParaTicket);
      localStorage.setItem('ultimo_pedido_venta_rapida', JSON.stringify(pedidoParaTicket));

      vaciarCarrito();
      setShowModalMetodoPago(false);

      setSuceso({
        show: true,
        titulo: '¡Éxito!',
        mensaje: `Venta realizada con éxito ($${totalFinal.toFixed(2)}), registrada con método ${tipoPagoElegido} y stock descontado.`,
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
    productosDisponibles,
    categorias,
    productoSeleccionado,
    setProductoSeleccionado,
    cantidad,
    setCantidad,
    categoriaSeleccionadaId,
    setCategoriaSeleccionadaId,
    carrito,
    
    subtotalVenta,
    montoDescuento,
    totalFinal,

    confirmarCancelacion,
    setConfirmarCancelacion,
    suceso,
    setSuceso,
    showModalMaquinas,
    setShowModalMaquinas,
    showModalMetodoPago,
    setShowModalMetodoPago,
    showModalStockCritico,
    setShowModalStockCritico,
    conflictosStockCritico,
    continuarFlujoPostStock,
    conflictosMaquinas,
    ultimoPedidoRealizado,
    verTicketPedido,
    setVerTicketPedido,

    handleAgregar,
    handleEliminarItem,
    handleValidarYCompletarVenta,
    ejecutarCompletarVenta,
    ejecutarCancelacion
  };
};