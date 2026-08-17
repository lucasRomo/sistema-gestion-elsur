import React from 'react';
import { FaltaStockCard } from '../components/FaltaStockCard';
import { SelectorProducto } from '../components/SelectorProducto';
import { CarritoLista } from '../components/CarritoLista';
import { ResumenVenta } from '../components/ResumenVenta';
import { PedidosPendientesCard } from '../components/PedidosPendientesCard';
import { VistaTicketModal } from '../../pedidos/modals/VistaTicketModal';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { NotificacionesCard } from '../components/NotificacionesCard';
import { useTheme } from '../../../Context/ThemeContext';
import { useVentaRapida } from '../hooks/useVentaRapida';
import { ModalElegirMetodoPago } from '../components/ModalElegirMetodoPago';

export const DashboardPrincipal: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
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
    showModalMetodoPago,    
    setShowModalMetodoPago, 
    setShowModalMaquinas,
    conflictosMaquinas,
    ultimoPedidoRealizado,
    verTicketPedido,
    setVerTicketPedido,
    handleAgregar,
    handleEliminarItem,
    handleValidarYCompletarVenta,
    ejecutarCompletarVenta,
    ejecutarCancelacion
  } = useVentaRapida();

  return (
    <div 
      className={`container-fluid font-monospace d-flex flex-column justify-content-between ${isDark ? 'text-white' : 'text-dark'}`}
      style={{ minHeight: 'calc(100vh - 40px)', paddingBottom: '10px' }}
    >
      {!isDark && (
        <style>{`
          select.form-select, 
          input.form-control {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }

          select.form-select:focus,
          select.form-select:focus-visible,
          select.form-select:active,
          input.form-control:focus,
          input.form-control:focus-visible,
          input.form-control:active {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #8e45e0 !important;
            box-shadow: 0 0 0 0.25rem rgba(142, 69, 224, 0.2) !important;
            outline: none !important;
          }

          select.form-select option {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
        `}</style>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.3rem', color: isDark ? '#ffffff' : '#ac76d8' }}>
            Panel principal
          </h1>
        </div>
      </div>

      <div className="row mb-3 g-3 flex-grow-0" style={{ minHeight: '220px' }}>
        <div className="col-12 col-md-4"><PedidosPendientesCard /></div>
        <div className="col-12 col-md-4"><NotificacionesCard /></div>
        <div className="col-12 col-md-4"><FaltaStockCard /></div>
      </div>

      {/* --- PANEL INFERIOR DE VENTA RÁPIDA --- */}
      <div 
        className="card p-4 flex-grow-1 d-flex flex-column justify-content-between" 
        style={{ 
          backgroundColor: isDark ? '#1E1E1F' : '#ffffff', 
          border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1', 
          borderRadius: '14px',
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)'
        }}
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

        <ModalElegirMetodoPago
         show={showModalMetodoPago}
         onClose={() => setShowModalMetodoPago(false)}
         total={totalFinal}
         onConfirmarPago={(datosPago) => ejecutarCompletarVenta(datosPago)}
         />
        
        <ResumenVenta 
          subtotal={subtotalVenta}
          montoDescuento={montoDescuento}
          total={totalFinal}
          categorias={categorias}
          categoriaSeleccionadaId={categoriaSeleccionadaId}
          onSeleccionarCategoria={setCategoriaSeleccionadaId}
          onCancelar={() => setConfirmarCancelacion(true)} 
          onCompletar={handleValidarYCompletarVenta} 
          ultimoPedido={ultimoPedidoRealizado}
          onImprimirTicketCliente={() => setVerTicketPedido({ pedido: ultimoPedidoRealizado, tipo: 'cliente' })}
          onImprimirTicketPago={() => setVerTicketPedido({ pedido: ultimoPedidoRealizado, tipo: 'pago' })}
        />
      </div>

      {/* MODAL VISTA PREVIA TICKET CLIENTE */}
      {verTicketPedido?.tipo === 'cliente' && (
        <VistaTicketModal 
          pedido={verTicketPedido.pedido}
          onClose={() => setVerTicketPedido(null)}
          esVentaRapida={true}
        />
      )}

      {/* MODAL VISTA PREVIA TICKET PAGO */}
      {verTicketPedido?.tipo === 'pago' && (
        <VistaTicketPagoModal 
          pedido={verTicketPedido.pedido}
          tipo="pago"
          onClose={() => setVerTicketPedido(null)}
        />
      )}

      {/* MODAL DE ADVERTENCIA DE MAQUINARIA */}
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
                    setShowModalMetodoPago(true);
                  }}
                >
                  Continuar de todos modos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCESO */}
      {suceso.show && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-4 text-white text-center" style={{ border: '2px solid #8e45e0', backgroundColor: '#1a1a1c', borderRadius: '12px' }}>
              <i className={`bi ${suceso.tipo === 'exito' ? 'bi-check-circle' : 'bi-x-circle'} fs-1 mb-2`} style={{ color: '#8e45e0' }}></i>
              <h5 className="fw-bold">{suceso.titulo}</h5>
              <p className="small" style={{ color: '#a1a1aa' }}>{suceso.mensaje}</p>
              
              <div className="d-flex flex-column gap-2 mt-3">
                {suceso.tipo === 'exito' && suceso.titulo === '¡Éxito!' && ultimoPedidoRealizado && (
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn fw-bold text-dark btn-sm flex-fill py-2" 
                      style={{ backgroundColor: '#eab308' }}
                      onClick={() => {
                        setSuceso({ ...suceso, show: false });
                        setVerTicketPedido({ pedido: ultimoPedidoRealizado, tipo: 'cliente' });
                      }}
                    >
                      <i className="bi bi-printer-fill me-1"></i> T. Cliente
                    </button>
                    <button 
                      className="btn fw-bold text-dark btn-sm flex-fill py-2" 
                      style={{ backgroundColor: '#38bdf8' }}
                      onClick={() => {
                        setSuceso({ ...suceso, show: false });
                        setVerTicketPedido({ pedido: ultimoPedidoRealizado, tipo: 'pago' });
                      }}
                    >
                      <i className="bi bi-receipt me-1"></i> T. Pago
                    </button>
                  </div>
                )}
                <button className="btn btn-secondary px-4 fw-semibold mt-1" onClick={() => setSuceso({ ...suceso, show: false })}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN */}
      {confirmarCancelacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
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