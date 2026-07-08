import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { SelectorProducto } from '../features/VentaRapida/SelectorProducto';
import { CarritoLista } from '../features/VentaRapida/CarritoLista';
import { ResumenVenta } from '../features/VentaRapida/ResumenVenta';
import type { Producto } from '../types/Producto';
import type { CartItem, Pedido } from '../types/Pedido';

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

  const payloadPedido = {
    cliente: { idCliente: 1 },
    fecha_entrega_estimada: new Date().toISOString(),
    monto_total: total,
    monto_pago_adelantado: total,
    es_cuenta_corriente: false,
    es_presupuesto: false,
    observaciones: "Venta Rápida",
    detalles: carrito.map(item => ({
      producto: { idProducto: item.producto.idProducto },
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioBase,
      subtotal: item.subtotal
    }))
  };

  try {
    // 1. Intentar crear el pedido
    const resCrear = await fetch('http://localhost:8080/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadPedido)
    });

    if (!resCrear.ok) throw new Error(await resCrear.text());
    
    const pedidoGuardado = await resCrear.json();

    // 2. Esperar a que la DB procese (Hotfix de concurrencia)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Intentar finalizar el pedido y descontar stock
    const resFinalizar = await fetch(`http://localhost:8080/api/pedidos/${pedidoGuardado.id_pedido}/finalizar`, {
      method: 'PATCH'
    });

    // Si el backend responde con error (ej: 400 Bad Request), capturamos el mensaje de stock
    if (!resFinalizar.ok) {
      throw new Error(await resFinalizar.text());
    }

    setCarrito([]);
    setSuceso({
      show: true,
      titulo: "¡Éxito!",
      mensaje: "Venta rápida realizada con éxito.",
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
  }
};

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
    <SidebarLayout activeItem="Venta Rápida">
      <div className="container-fluid font-monospace text-white">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Panel principal
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>
        

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


        <div className="card p-4 shadow" style={{ backgroundColor: '#1E1E1F', border: '1px solid #3f3f46', borderRadius: '12px' }}>
          <SelectorProducto 
            productos={productosDisponibles}
            productoId={productoSeleccionado}
            setProductoId={setProductoSeleccionado}
            cantidad={cantidad}
            setCantidad={setCantidad}
            onAgregar={handleAgregar}
          />
          <CarritoLista carrito={carrito} onEliminar={handleEliminarItem} />
          <ResumenVenta total={calcularTotal()} onCancelar={handleCancelar} onCompletar={handleCompletarVenta} />
        </div>
      </div>
    </SidebarLayout>
  );
};