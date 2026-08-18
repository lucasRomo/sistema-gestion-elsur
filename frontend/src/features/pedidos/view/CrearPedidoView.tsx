import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelectorProductosForm } from '../components/SelectorProductosForm';
import { DetallesPedidoForm } from '../components/DetallesPedidoForm';
import { useRegistrarPedido } from '../hooks/useRegistrarPedido';
import { crearPedidoService } from '../service/crearPedidoService';
import type { CartItem, Pedido, MovimientoCaja } from '../types/Pedido';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';

export const CrearPedidoView: React.FC = () => {
  const navigate = useNavigate();
  
  const { productos, clientes, empleados, maquinas, pedidosPendientes, enviarPedido } = useRegistrarPedido();
  
  const [paso, setPaso] = useState<number>(1);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<string>('');
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  
  const [suceso, setSuceso] = useState({ show: false, titulo: "", mensaje: "", tipo: "exito" });
  const [confirmarGuardado, setConfirmarGuardado] = useState(false);
  
  // Estado para desplegar el ticket impreso/vista tras guardar
  const [ticketGenerado, setTicketGenerado] = useState<{ pedido: Pedido; movimiento?: MovimientoCaja } | null>(null);

  const [payloadTemporal, setPayloadTemporal] = useState<{ pedido: any; idEmpleado: number; idUsuario: number | null; tipoPago: string } | null>(null);
  const [fileTemporal, setFileTemporal] = useState<File | null>(null);
  

  // Carga inicial de categorías modularizada
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const categoriasNormalizadas = await crearPedidoService.obtenerCategoriasCliente();
        setCategorias(categoriasNormalizadas);
      } catch (error) {
        console.error("Error al obtener categorías:", error);
      }
    };

    fetchCategorias();
  }, []);

  const subtotalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const catActual = categorias.find(c => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentajeDescuento = catActual 
    ? Number(catActual.porcentajeDescuento ?? (catActual as any).descuentoAutomatico ?? (catActual as any).descuento_automatico ?? 0) 
    : 0;
  
  const categoriaNombre = catActual 
    ? (catActual.nombreCategoria ?? (catActual as any).nombre ?? 'General')
    : '';
  
    
  const montoDescuento = (subtotalCarrito * porcentajeDescuento) / 100;
  const totalConDescuento = subtotalCarrito - montoDescuento;
  

  const handlePreGuardar = async (payloadEstructurado: { 
    pedido: any; 
    idEmpleado: number; 
    tipoPago: string; 
    fileComprobante?: File | null; 
  }) => {
    const idUsuarioLogueado = (() => {
      const usuarioJson = localStorage.getItem('usuario_logueado');
      if (usuarioJson) {
        try {
          const usuarioObj = JSON.parse(usuarioJson);
          return usuarioObj.idUsuario ? parseInt(usuarioObj.idUsuario) : null;
        } catch (e) {
          console.error("Error al parsear usuario_logueado:", e);
        }
      }
      return null;
    })();

    const payloadConUsuario = {
      pedido: payloadEstructurado.pedido,
      idEmpleado: payloadEstructurado.idEmpleado,
      idUsuario: idUsuarioLogueado,
      tipoPago: payloadEstructurado.tipoPago
    };

    setPayloadTemporal(payloadConUsuario); 
    setFileTemporal(payloadEstructurado.fileComprobante || null);
    setConfirmarGuardado(true); 
  };

  const ejecutarGuardadoFinal = async () => {
    if (!payloadTemporal) return;
    setConfirmarGuardado(false); 

    try {
      const resultado: any = await enviarPedido(payloadTemporal, fileTemporal);
      
      // Si el backend devuelve el objeto pedido con sus movimientos (ticket)
      if (resultado) {
        const pedidoGuardado = (typeof resultado === 'object' && resultado.id_pedido) ? resultado : payloadTemporal.pedido;
        const movTicket = pedidoGuardado.movimientos && pedidoGuardado.movimientos.length > 0
          ? pedidoGuardado.movimientos[pedidoGuardado.movimientos.length - 1]
          : undefined;

        if (payloadTemporal.pedido.monto_pago_adelantado > 0) {
          setTicketGenerado({ pedido: pedidoGuardado, movimiento: movTicket });
        } else {
          setSuceso({
            show: true,
            titulo: "¡Pedido Guardado!",
            mensaje: "Se ha creado el pedido exitosamente.",
            tipo: "exito"
          });
        }
      }
    } catch (err: any) { 
      setSuceso({
        show: true,
        titulo: "Algo ha ido mal",
        mensaje: err.message || "Hubo un error al procesar el guardado del pedido.",
        tipo: "error"
      });
    }
  };

  const handleCerrarTicket = () => {
    setTicketGenerado(null);
    navigate('/dashboard');
  };

  const handleCerrarModalSuceso = () => {
    const eraExito = suceso.tipo === "exito";
    setSuceso({ ...suceso, show: false });
    if (eraExito) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <div className="container-fluid min-vh-100 d-flex flex-column py-2">
        {paso === 1 ? (
          <SelectorProductosForm 
            productos={productos}
            carrito={carrito}
            setCarrito={setCarrito}
            categorias={categorias}
            categoriaSeleccionadaId={categoriaSeleccionadaId}
            setCategoriaSeleccionadaId={setCategoriaSeleccionadaId}
            maquinas={maquinas}
            pedidosPendientes={pedidosPendientes}
            onSiguiente={() => setPaso(2)}
            onCancelar={() => navigate('/dashboard')}
          />
        ) : (
          <DetallesPedidoForm 
            clientes={clientes}
            empleados={empleados}
            total={totalConDescuento}
            porcentajeDescuento={porcentajeDescuento}
            categoriaNombre={categoriaNombre}
            carrito={carrito}
            onVolver={() => setPaso(1)}
            onGuardar={handlePreGuardar}
          />
        )}
      </div>

      {/* Modal de Confirmación */}
      {confirmarGuardado && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center custom-modal-card" 
              style={{ border: '2px solid #8e45e0', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className="bi bi-question-circle fs-1 mb-2" style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">¿Confirmar registro?</h5>
              <p className="small text-muted">
                {fileTemporal 
                  ? `¿Está listo para finalizar el Pedido con el comprobante "${fileTemporal.name}" adjunto?` 
                  : '¿Está listo para finalizar el Pedido?'}
              </p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button 
                  className="btn btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#e22e2e', border: '1px solid #e22e2e' }} 
                  onClick={() => setConfirmarGuardado(false)}
                >
                  Volver
                </button>
                <button 
                  className="btn btn-sm px-3 text-white" 
                  style={{ borderRadius: '6px', backgroundColor: '#288f47', border: '1px solid #2e9225' }} 
                  onClick={ejecutarGuardadoFinal}
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Movimiento de Caja */}
      {ticketGenerado && (
      <VistaTicketPagoModal 
       pedido={ticketGenerado.pedido}
       movimiento={ticketGenerado.movimiento}
       onClose={handleCerrarTicket}
      />
      )}

      {/* Modal de Resultado sin ticket */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white text-center custom-modal-card" 
              style={{ border: '2px solid #8e45e0', borderRadius: '12px', fontFamily: 'monospace' }}
            >
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small text-muted">{suceso.mensaje}</p>
              <button 
                className={`btn ${suceso.tipo === 'exito' ? 'btn-success' : 'btn-danger'} btn-sm px-4 mt-3 fw-bold`}
                style={{ borderRadius: '6px' }}
                onClick={handleCerrarModalSuceso}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};