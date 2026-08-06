import React, { useState, useEffect } from 'react';
import { FaltaStockCard } from '../features/VentaRapida/FaltaStockCard';
import { SelectorProducto } from '../features/VentaRapida/SelectorProducto';
import { CarritoLista } from '../features/VentaRapida/CarritoLista';
import { ResumenVenta } from '../features/VentaRapida/ResumenVenta';
import type { Producto } from '../types/Producto';
import type { CartItem } from '../types/Pedido';
import type { CategoriaCliente } from '../types/CategoriaCliente';
import type { Maquina } from '../types/Maquina';
import { PedidosPendientesCard } from '../features/VentaRapida/PedidosPendientesCard';

export const VentaRapida: React.FC = () => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('1');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });

  // Estado para el modal de advertencia de máquinas fuera de servicio
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

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

    const fetchMaquinas = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/maquinas');
        if (response.ok) {
          const data = await response.json();
          setMaquinas(data);
        }
      } catch (error) {
        console.error("Error al obtener máquinas:", error);
      }
    };

    fetchProductos();
    fetchCategorias();
    fetchMaquinas();
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

  // CÁLCULOS DE PRECIO Y DESCUENTO
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

  // VALIDACIÓN DE MAQUINARIA FUERA DE SERVICIO / FALLA / MANTENIMIENTO
  const handleValidarYCompletarVenta = () => {
    if (carrito.length === 0) {
      setSuceso({
        show: true,
        titulo: "Carrito vacío",
        mensaje: "Debes agregar al menos un producto antes de completar la venta.",
        tipo: "error"
      });
      return;
    }

    const conflictos: { productoNombre: string; maquinaNombre: string; estado: string }[] = [];

    carrito.forEach(item => {
      const prod = item.producto as any;
      if (!prod) return;

      const maquinaAsociada = prod.maquinaNecesaria || prod.maquina || prod.maquinaAsociada;
      const maquinaId = maquinaAsociada?.idMaquina ?? maquinaAsociada?.id ?? prod.idMaquina;

      let maquinaObj: any = undefined;
      if (maquinaId !== undefined && maquinaId !== null && maquinas.length > 0) {
        maquinaObj = maquinas.find(m => String(m.idMaquina) === String(maquinaId));
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

  const ejecutarCompletarVenta = async () => {
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
        <div className="col-12 col-md-6">
          <PedidosPendientesCard />
        </div>
        <div className="col-12 col-md-6">
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
          onCompletar={handleValidarYCompletarVenta} 
        />
      </div>

      {/* MODAL MÁQUINAS FUERA DE SERVICIO */}
      {showModalMaquinas && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white" 
              style={{ border: '2px solid #ffc107', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <div className="text-center mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-1 text-warning"></i>
                <h5 className="fw-bold mt-2 text-warning">¡Atención! Maquinaria Fuera de Servicio</h5>
              </div>
              
              <p className="small text-light">
                Los siguientes productos seleccionados requieren maquinaria que actualmente no está operativa:
              </p>

              <div className="list-group mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {conflictosMaquinas.map((conf, idx) => (
                  <div key={idx} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{conf.productoNombre}</div>
                      <small className="text-secondary">Equipo: {conf.maquinaNombre}</small>
                    </div>
                    <span className="badge bg-danger">{conf.estado}</span>
                  </div>
                ))}
              </div>

              <p className="small text-secondary mb-4 text-center">
                ¿Desea continuar con la venta rápida de todos modos o cancelar para modificar el carrito?
              </p>

              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-sm px-3 text-white" 
                  style={{ backgroundColor: '#e22e2e', border: '1px solid #e22e2e', borderRadius: '6px' }}
                  onClick={() => setShowModalMaquinas(false)}
                >
                  Cancelar / Volver
                </button>
                <button 
                  className="btn btn-sm px-3 text-dark font-weight-bold" 
                  style={{ backgroundColor: '#ffc107', border: '1px solid #ffc107', borderRadius: '6px', fontWeight: 'bold' }}
                  onClick={() => {
                    setShowModalMaquinas(false);
                    ejecutarCompletarVenta();
                  }}
                >
                  Continuar de todos modos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales Suceso & Confirmación */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              <button className="btn btn-success btn-sm px-4 mt-3 fw-bold" onClick={() => setSuceso({ ...suceso, show: false })}>
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