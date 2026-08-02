import React, { useState, useEffect } from 'react';
import { FaltaStockCard } from '../features/VentaRapida/FaltaStockCard';
import { SelectorProducto } from '../features/VentaRapida/SelectorProducto';
import { CarritoLista } from '../features/VentaRapida/CarritoLista';
import { ResumenVenta } from '../features/VentaRapida/ResumenVenta';
import type { Producto } from '../types/Producto';
import type { CartItem } from '../types/Pedido';
import type { CategoriaCliente } from '../types/CategoriaCliente';
import { PedidosPendientesCard } from '../features/VentaRapida/PedidosPendientesCard';
import { VistaTicketModal } from '../features/pedidos/VistaTicketModal';
import { NotificacionesCard } from '../features/VentaRapida/NotificacionesCard';

export const VentaRapida: React.FC = () => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });

  // RECUPERAR ÚLTIMO PEDIDO DE LOCALSTORAGE AL INICIALIZAR EL ESTADO
  const [ultimoPedidoRealizado, setUltimoPedidoRealizado] = useState<any | null>(() => {
    const guardado = localStorage.getItem('ultimo_pedido_venta_rapida');
    return guardado ? JSON.parse(guardado) : null;
  });

  const [verTicketPedido, setVerTicketPedido] = useState<any | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/productos');
        if (response.ok) {
          const data = await response.json();
          setProductosDisponibles(data.filter((p: Producto) => p.estado === 'Activo'));
        }
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };

    const fetchCategorias = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categorias-cliente');
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
        console.error("Error al obtener categorías:", error);
      }
    };

    fetchProductos();
    fetchCategorias();
  }, []);

  const handleAgregar = () => {
    if (!productoSeleccionado || !cantidad || parseInt(cantidad) <= 0) return;
    const producto = productosDisponibles.find(p => p.idProducto?.toString() === productoSeleccionado);
    if (!producto) return;

    const qty = parseInt(cantidad);
    setCarrito([...carrito, { producto, cantidad: qty, subtotal: producto.precioBase * qty }]);
    setProductoSeleccionado('');
    setCantidad('1');
  };

  const handleEliminarItem = (index: number) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  const subtotalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  
  const categoriaActual = categorias.find(c => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentajeDescuento = categoriaActual 
    ? (categoriaActual.porcentajeDescuento ?? (categoriaActual as any).descuentoAutomatico ?? (categoriaActual as any).descuento_automatico ?? 0) 
    : 0;
  
  const montoDescuento = (subtotalVenta * porcentajeDescuento) / 100;
  const totalFinal = subtotalVenta - montoDescuento;

  const handleCompletarVenta = async () => {
    if (carrito.length === 0) {
      setSuceso({
        show: true,
        titulo: "Carrito vacío",
        mensaje: "Debes agregar al menos un producto antes de completar la venta.",
        tipo: "error"
      });
      return;
    }

    const idUsuarioLogueado = (() => {
      const usuarioJson = localStorage.getItem('usuario_logueado');
      if (usuarioJson) {
        try {
          const usuarioObj = JSON.parse(usuarioJson);
          return usuarioObj.idUsuario ? parseInt(usuarioObj.idUsuario) : null;
        } catch (e) {
          console.error("Error al parsear el usuario_logueado desde localStorage:", e);
        }
      }
      return null;
    })();

    const payloadParaBackend = {
      pedido: {
        cliente: { id_cliente: 1 }, 
        fecha_entrega_estimada: new Date().toISOString(),
        monto_total: totalFinal,
        monto_pago_adelantado: 0,
        es_cuenta_corriente: false,
        es_presupuesto: false,
        observaciones: `Venta Rápida ${porcentajeDescuento > 0 ? `(Categoría: ${categoriaActual?.nombreCategoria} - ${porcentajeDescuento}% Desc.)` : ''}`,
        detalles: carrito.map(item => ({
          producto: { idProducto: item.producto.idProducto },
          cantidad: item.cantidad,
          precioUnitario: item.producto.precioBase,
          subtotal: item.subtotal
        }))
      },
      idEmpleado: idUsuarioLogueado
    };

    try {
      const resCrear = await fetch('http://localhost:8080/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadParaBackend)
      });

      if (!resCrear.ok) throw new Error(await resCrear.text());
      
      const pedidoGuardado = await resCrear.json();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const formDataPago = new FormData();
      const payloadPago = {
        monto: totalFinal,
        tipoPago: 'EFECTIVO',
        idUsuario: idUsuarioLogueado
      };

      formDataPago.append("payload", JSON.stringify(payloadPago));

      const resPago = await fetch(`http://localhost:8080/api/pedidos/${pedidoGuardado.id_pedido}/pagos`, {
        method: 'POST',
        body: formDataPago
      });

      if (!resPago.ok) {
        const errorText = await resPago.text();
        throw new Error(errorText || "Error al registrar el cobro en el sistema de caja.");
      }

      // GUARDAR EN ESTADO Y PERSISTIR EN LOCALSTORAGE
      setUltimoPedidoRealizado(pedidoGuardado);
      localStorage.setItem('ultimo_pedido_venta_rapida', JSON.stringify(pedidoGuardado));

      setCarrito([]);
      setCategoriaSeleccionadaId('');
      setSuceso({
        show: true,
        titulo: "¡Éxito!",
        mensaje: `Venta realizada con éxito ($${totalFinal.toFixed(2)}) y registrada en Caja.`,
        tipo: "exito"
      });
    } catch (error: any) {
      console.error("Error en la venta:", error.message);
      setSuceso({
        show: true,
        titulo: "Algo ha ido mal",
        mensaje: error.message || "No se pudo completar la venta.", 
        tipo: "error"
      });
    }
  };

  const handleCancelar = () => {
    setConfirmarCancelacion(true);
  };

  const ejecutarCancelacion = () => {
    setCarrito([]);
    setProductoSeleccionado('');
    setCategoriaSeleccionadaId('');
    setCantidad('1');
    setConfirmarCancelacion(false);
    setSuceso({
      show: true,
      titulo: "¡Cancelado!",
      mensaje: "El carrito ha sido borrado con éxito.",
      tipo: "exito"
    });
  };

  return (
    <div 
      className="container-fluid font-monospace text-white d-flex flex-column justify-content-between"
      style={{ minHeight: 'calc(100vh - 40px)', paddingBottom: '10px' }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.3rem', color: '#ffffff' }}>
            Panel principal
          </h1>
        </div>
      </div>

    <div className="row mb-3 g-3 flex-grow-0" style={{ minHeight: '220px' }}>
      <div className="col-12 col-md-4">
      <PedidosPendientesCard />
      </div>
      <div className="col-12 col-md-4">
      <NotificacionesCard />
      </div>
      <div className="col-12 col-md-4">
      <FaltaStockCard />
      </div>
    </div>

      {/* --- PANEL INFERIOR --- */}
      <div 
        className="card p-4 shadow flex-grow-1 d-flex flex-column justify-content-between" 
        style={{ backgroundColor: '#1E1E1F', border: '1px solid #3f3f46', borderRadius: '12px' }}
      >
        <div>
          <SelectorProducto 
            productos={productosDisponibles}
            productoId={productoSeleccionado}
            setProductoId={setProductoSeleccionado}
            cantidad={cantidad}
            setCantidad={setCantidad}
            onAgregar={handleAgregar}
          />
          <CarritoLista carrito={carrito} onEliminar={handleEliminarItem} />
        </div>
        
        {/* COMPONENTE RESUMEN DE VENTA */}
        <ResumenVenta 
          subtotal={subtotalVenta}
          montoDescuento={montoDescuento}
          total={totalFinal}
          categorias={categorias}
          categoriaSeleccionadaId={categoriaSeleccionadaId}
          onSeleccionarCategoria={setCategoriaSeleccionadaId}
          onCancelar={handleCancelar} 
          onCompletar={handleCompletarVenta} 
          ultimoPedido={ultimoPedidoRealizado}
          onImprimirTicket={() => setVerTicketPedido(ultimoPedidoRealizado)}
        />
      </div>

      {/* MODAL DE VISTA PREVIA DEL TICKET */}
      {verTicketPedido && (
        <VistaTicketModal 
          pedido={verTicketPedido}
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {/* Modales Suceso & Confirmación */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              
              <div className="d-flex flex-column gap-2 mt-3">
                {suceso.tipo === 'exito' && suceso.titulo === '¡Éxito!' && ultimoPedidoRealizado && (
                  <button 
                    className="btn fw-bold text-dark btn-sm px-3 py-2" 
                    style={{ backgroundColor: '#eab308' }}
                    onClick={() => {
                      setSuceso({ ...suceso, show: false });
                      setVerTicketPedido(ultimoPedidoRealizado);
                    }}
                  >
                    <i className="bi bi-printer-fill me-1"></i> Imprimir Ticket
                  </button>
                )}
                <button style={{ backgroundColor: 'rgb(175, 58, 50)', border: 'none' }} className="btn btn-secondary btn-sm px-4 fw-bold" onClick={() => setSuceso({ ...suceso, show: false })}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarCancelacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className="bi bi-exclamation-triangle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Cancelar venta?</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>Esta acción vaciará el carrito. ¿Estás seguro?</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm px-3" onClick={() => setConfirmarCancelacion(false)}>Volver</button>
                <button className="btn btn-danger btn-sm px-3" onClick={ejecutarCancelacion}>Sí, cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};