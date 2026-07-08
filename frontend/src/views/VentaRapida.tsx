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
  if (carrito.length === 0) return alert("El carrito está vacío");
  const total = calcularTotal();

  const payloadPedido = {
    cliente: { idCliente: 1 },
    fecha_entrega_estimada: new Date().toISOString(),
    monto_total: total,
    monto_pago_adelantado: total,
    es_cuenta_corriente: false,
    es_presupuesto: false,
    estado: "VENTA_RAPIDA",
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

    if (!resCrear.ok) {
      const errorText = await resCrear.text();
      throw new Error(errorText);
    }
    
    const pedidoGuardado = await resCrear.json();

    // 2. Esperar a que la DB procese (Hotfix de concurrencia)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Intentar finalizar el pedido y descontar stock
    const resFinalizar = await fetch(`http://localhost:8080/api/pedidos/${pedidoGuardado.id_pedido}/finalizar`, {
      method: 'PATCH'
    });

    // Si el backend responde con error (ej: 400 Bad Request), capturamos el mensaje de stock
    if (!resFinalizar.ok) {
      const errorMensaje = await resFinalizar.text();
      throw new Error(errorMensaje);
    }

    alert(`¡Venta rápida #${pedidoGuardado.id_pedido} completada!`);
    setCarrito([]);
  } catch (error: any) {
    // Si ocurre un error, el mensaje de stock (o error de DB) se mostrará aquí
    console.error("Error en la venta:", error.message);
    alert(error.message); 
  }
};
  const handleCancelar = () => {
    if (confirm("¿Seguro que quieres cancelar la venta?")) {
      setCarrito([]);
      setProductoSeleccionado('');
      setCantidad('1');
    }
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
        
        <div className="card p-4 shadow" style={{ backgroundColor: '#1e1e24', border: '1px solid #3f3f46', borderRadius: '12px' }}>
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