import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { FaltaStockCard } from '../features/VentaRapida/FaltaStockCard';
import { SelectorProducto } from '../features/VentaRapida/SelectorProducto';
import { CarritoLista } from '../features/VentaRapida/CarritoLista';
import { ResumenVenta } from '../features/VentaRapida/ResumenVenta';
import type { Producto } from '../types/Producto';
import type { CartItem, Pedido } from '../types/Pedido';
import { PedidosPendientesCard } from '../features/VentaRapida/PedidosPendientesCard';

export const VentaRapida: React.FC = () => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });

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
    fetchProductos();
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

  const calcularTotal = () => carrito.reduce((acc, item) => acc + item.subtotal, 0);

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
  const total = calcularTotal();
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
        monto_total: total,
        monto_pago_adelantado: 0,
        es_cuenta_corriente: false,
        es_presupuesto: false,
        observaciones: "Venta Rápida",
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
    // 1. Intentar crear el pedido
    const resCrear = await fetch('http://localhost:8080/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadParaBackend) // ➔ Enviamos el objeto correcto
      });

    if (!resCrear.ok) throw new Error(await resCrear.text());
    
    const pedidoGuardado = await resCrear.json();

    // 2. Esperar a que la DB procese (Hotfix de concurrencia)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const formDataPago = new FormData();
    const payloadPago = {
        monto: total,
        tipoPago: 'EFECTIVO',
        idUsuario: idUsuarioLogueado
      };

    formDataPago.append("payload", JSON.stringify(payloadPago));

    // MODIFICACIÓN: Ya no pasamos parámetros en la URL, pasamos el objeto en el body
    const resPago = await fetch(`http://localhost:8080/api/pedidos/${pedidoGuardado.id_pedido}/pagos`, {
        method: 'POST',
        body: formDataPago
      });

    if (!resPago.ok) {
        const errorText = await resPago.text();
        throw new Error(errorText || "Error al registrar el cobro en el sistema de caja.");
    }

    // Si todo salió bien, limpiamos el carrito e informamos del éxito
    setCarrito([]);
    setSuceso({
      show: true,
      titulo: "¡Éxito!",
      mensaje: "Venta rápida realizada con éxito y registrada en Caja.",
      tipo: "exito"
    });
    } catch (error: any) {
    console.error("Error en la venta:", error.message);
    setSuceso({
      show: true,
      titulo: "Algo ha ido mal",
      mensaje: error.message || "No hay suficiente stock para completar la venta.", 
      tipo: "error"
    });
  }};

  const handleCancelar = () => {
  setConfirmarCancelacion(true);
  };

  const ejecutarCancelacion = () => {
  setCarrito([]);
  setProductoSeleccionado('');
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
    <>
      {/* 🔹 Aplicamos h-100 / calc() para ocupar la pantalla completa sin sobrepasar */}
      <div 
        className="container-fluid font-monospace text-white d-flex flex-column justify-content-between"
        style={{ minHeight: 'calc(100vh - 40px)', paddingBottom: '10px' }}
      >

        {/* --- TÍTULO --- */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.3rem', color: '#ffffff' }}>
              Panel principal
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>

        {/* --- WIDGETS SUPERIORES --- */}
        <div className="row mb-3 g-3 flex-grow-0" style={{ minHeight: '220px' }}>
          {/* Columna Izquierda: Pedidos Pendientes */}
          <div className="col-12 col-md-6">
            <PedidosPendientesCard />
          </div>

          {/* Columna Derecha: Tarjeta de Stock Bajo */}
          <div className="col-12 col-md-6">
            <FaltaStockCard />
          </div>
        </div>

        {/* --- MODALES --- */}
        {suceso.show && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div 
                className="modal-content p-4 text-white text-center" 
                style={{ 
                  border: `2px solid ${suceso.tipo === 'exito' ? '#8e45e0' : '#8e45e0'}`, 
                  backgroundColor: '#1a1a1c', 
                  borderRadius: '12px' 
                }}
              >
                <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
                <h5 className="fw-bold">{suceso.titulo}</h5>
                <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
                <button 
                  className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                  onClick={() => setSuceso({ ...suceso, show: false })}
                >
                  Cerrar
                </button>
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
                  <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px', backgroundColor: '#e22e2e', borderColor: '#e62020'}} onClick={() => setConfirmarCancelacion(false)}>
                    Volver
                  </button>
                  <button className="btn btn-outline-secondary btn-sm px-3 text-white" style={{ borderRadius: '6px', backgroundColor: '#2e9225', borderColor: '#25741e' }} onClick={ejecutarCancelacion}>
                    Sí, cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VENTA RÁPIDA (Se expande para llenar la parte inferior) --- */}
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
          
          <ResumenVenta total={calcularTotal()} onCancelar={handleCancelar} onCompletar={handleCompletarVenta} />
        </div>

      </div>
    </>
  );
};