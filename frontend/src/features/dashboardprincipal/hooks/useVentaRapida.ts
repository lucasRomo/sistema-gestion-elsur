import { useState, useEffect, useMemo } from 'react';
import type { Producto } from '../../productos/types/Producto';
import type { CartItem, Pedido } from '../../pedidos/general/types/Pedido';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';

const API_BASE = 'http://localhost:8080/api';
const MARGEN_MERMA_RESPALDO = 5;
const TOLERANCIA_PRODUCTO_DIRECTO = 3;

export const useVentaRapida = () => {
  // --- ESTADOS DE DATOS / CATÁLOGOS ---
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState<any[]>([]);

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
    unidad: string;
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
      const [resProductos, resRecetas] = await Promise.all([
        fetch(`${API_BASE}/productos`),
        fetch(`${API_BASE}/producto-insumo`)
      ]);

      if (resProductos.ok) {
        const rawProductos = await resProductos.json();
        const rawRecetas = resRecetas.ok ? await resRecetas.json() : [];

        const productosConReceta = rawProductos
          .filter((p: Producto) => p.estado === 'Activo')
          .map((p: any) => {
            const receta = rawRecetas.filter((r: any) => 
              (r.idProducto ?? r.producto?.idProducto) === p.idProducto
            );
            return {
              ...p,
              receta: receta.length > 0 ? receta : (p.productoInsumos || [])
            };
          });

        setProductosDisponibles(productosConReceta);
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
        const ESTADOS_INACTIVOS = ['FINALIZADO', 'ENTREGADO', 'CANCELADO', 'COMPLETADO', 'RECHAZADO'];

        const activos = data.filter((p: any) => {
          const estadoUpper = (p.estado || '').toString().trim().toUpperCase();
          const esPresupuesto = Boolean(p.es_presupuesto || p.esPresupuesto);
          return !esPresupuesto && !ESTADOS_INACTIVOS.includes(estadoUpper);
        });

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

  // --- CÁLCULO DINÁMICO DE IMPACTO EN STOCK (elementosAfectados) ---
  const elementosAfectados = useMemo(() => {
    const mapaElementos = new Map<string, {
      key: string;
      id: string | number;
      nombre: string;
      unidad: string;
      cantPedidoActual: number;
      cantReservadaPendientes: number;
      cantTotalRequerida: number;
      stockActual: number;
      stockMinimo: number;
      tipo: 'Insumo' | 'Producto Directo';
    }>();

    const procesarItem = (prod: any, cantidadReq: number, esPedidoActual: boolean) => {
      if (!prod) return;

      const listaInsumos = Array.isArray(prod.receta) && prod.receta.length > 0 
        ? prod.receta 
        : (Array.isArray(prod.productoInsumos) ? prod.productoInsumos : (prod.insumos || []));

      if (listaInsumos.length > 0) {
        listaInsumos.forEach((pi: any) => {
          if (!pi) return;
          const insumoRaw = pi.insumo || pi;
          const id = insumoRaw?.idInsumo ?? pi?.idInsumo ?? insumoRaw?.id;
          if (id === undefined || id === null) return;

          const key = `INSUMO_${id}`;
          const insumoActualizado = insumosCatalogo.find((i: any) => 
            String(i.idInsumo ?? i.id_insumo ?? i.id) === String(id)
          ) || insumoRaw;

          const nombre = insumoActualizado?.nombreInsumo || insumoActualizado?.nombre_insumo || insumoRaw?.nombreInsumo || 'Insumo';
          const uMedida = insumoActualizado?.unidadMedida || insumoRaw?.unidadMedida;
          const unidad = typeof uMedida === 'object' && uMedida !== null 
            ? (uMedida.nombre || uMedida.simbolo || 'uds') 
            : String(uMedida || 'uds');

          const stockActual = Number(insumoActualizado?.stockActual ?? insumoActualizado?.stock_actual ?? insumoActualizado?.stockSuelto ?? 0);
          const stockMinimo = Number(insumoActualizado?.stockMinimo ?? insumoActualizado?.stock_minimo ?? 0);
          
          const cantUnitaria = Number(pi.cantidadConsumo ?? pi.cantidadProporcion ?? pi.cantidad_proporcion ?? pi.cantidad ?? 1);
          const totalRequerido = cantUnitaria * cantidadReq;

          if (mapaElementos.has(key)) {
            const item = mapaElementos.get(key)!;
            if (esPedidoActual) item.cantPedidoActual += totalRequerido;
            else item.cantReservadaPendientes += totalRequerido;
            item.cantTotalRequerida += totalRequerido;
          } else {
            mapaElementos.set(key, {
              key,
              id,
              nombre,
              unidad,
              cantPedidoActual: esPedidoActual ? totalRequerido : 0,
              cantReservadaPendientes: esPedidoActual ? 0 : totalRequerido,
              cantTotalRequerida: totalRequerido,
              stockActual,
              stockMinimo,
              tipo: 'Insumo'
            });
          }
        });
      } else {
        const idProd = prod.idProducto ?? prod.id_producto ?? prod.id;
        if (idProd === undefined || idProd === null) return;

        const insumoCoincidente = insumosCatalogo.find((i: any) => 
          String(i.idInsumo ?? i.id) === String(idProd) ||
          (i.nombreInsumo && prod.nombreProducto && i.nombreInsumo.toLowerCase() === prod.nombreProducto.toLowerCase())
        );

        const key = insumoCoincidente ? `INSUMO_${insumoCoincidente.idInsumo}` : `PROD_${idProd}`;
        const nombre = prod.nombreProducto || prod.nombre || 'Producto Directo';

        const stockActual = insumoCoincidente 
          ? Number(insumoCoincidente.stockActual ?? insumoCoincidente.stockSuelto ?? 0)
          : Number(prod.stockActual ?? prod.stock_actual ?? prod.stock ?? 0);

        const stockMinimoBase = insumoCoincidente
          ? Number(insumoCoincidente.stockMinimo ?? 0)
          : Number(prod.stockMinimo ?? prod.stock_minimo ?? 0);

        const stockMinimo = insumoCoincidente ? stockMinimoBase : Math.max(stockMinimoBase, TOLERANCIA_PRODUCTO_DIRECTO);

        const uMedida = insumoCoincidente ? insumoCoincidente.unidadMedida : 'uds';
        const unidad = typeof uMedida === 'object' && uMedida !== null 
          ? (uMedida.nombre || uMedida.simbolo || 'uds') 
          : String(uMedida || 'uds');

        if (mapaElementos.has(key)) {
          const item = mapaElementos.get(key)!;
          if (esPedidoActual) item.cantPedidoActual += cantidadReq;
          else item.cantReservadaPendientes += cantidadReq;
          item.cantTotalRequerida += cantidadReq;
        } else {
          mapaElementos.set(key, {
            key,
            id: idProd,
            nombre,
            unidad,
            cantPedidoActual: esPedidoActual ? cantidadReq : 0,
            cantReservadaPendientes: esPedidoActual ? 0 : cantidadReq,
            cantTotalRequerida: cantidadReq,
            stockActual,
            stockMinimo,
            tipo: insumoCoincidente ? 'Insumo' : 'Producto Directo'
          });
        }
      }
    };

    carrito.forEach((item) => {
      procesarItem(item.producto, Number(item.cantidad) || 1, true);
    });

    if (Array.isArray(pedidosPendientes)) {
      pedidosPendientes.forEach((ped) => {
        const detalles = ped.detalles || (ped as any).pedidoDetalles || [];
        detalles.forEach((det: any) => {
          const idProd = det.producto?.idProducto ?? det.idProducto;
          const prodCompleto = productosDisponibles.find((p: any) => p.idProducto === idProd) || det.producto;
          if (prodCompleto) {
            procesarItem(prodCompleto, Number(det.cantidad || 1), false);
          }
        });
      });
    }

    return Array.from(mapaElementos.values()).filter(item => item.cantPedidoActual > 0);
  }, [carrito, pedidosPendientes, productosDisponibles, insumosCatalogo]);

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

  // --- VALIDACIÓN DE STOCK Y MAQUINARIA ---
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

    // 1. Validar Stock Bloqueante (saldo físico < 0)
    for (const item of elementosAfectados) {
      const saldoFisico = item.stockActual - item.cantTotalRequerida;
      if (saldoFisico < 0) {
        const faltante = Math.abs(saldoFisico);
        setSuceso({
          show: true,
          titulo: 'Stock Insuficiente',
          mensaje: `No hay stock suficiente para "${item.nombre}". Faltan ${faltante} ${item.unidad}(s) para completar este pedido.`,
          tipo: 'error',
        });
        return;
      }
    }

    // 2. Validar Stock Crítico (Respaldo de 5 unidades)
    const criticos: { nombre: string; tipo: string; quedaran: number; tolerancia: number; unidad: string }[] = [];

    for (const item of elementosAfectados) {
      const saldoFisico = item.stockActual - item.cantTotalRequerida;
      const stockResultante = saldoFisico - MARGEN_MERMA_RESPALDO;

      if (saldoFisico >= 0 && stockResultante <= item.stockMinimo) {
        criticos.push({
          nombre: item.nombre,
          tipo: item.tipo,
          quedaran: stockResultante,       
          tolerancia: item.stockMinimo,    
          unidad: item.unidad            
        });
      }
    }

    if (criticos.length > 0) {
      setConflictosStockCritico(criticos);
      setShowModalStockCritico(true);
      return;
    }

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
    elementosAfectados,
    
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