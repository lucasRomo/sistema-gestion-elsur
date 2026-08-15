import React, { useState } from 'react';

interface Props {
  pedido: any;
  onClose: () => void;
  esVentaRapida?: boolean;
}

export const VistaTicketModal: React.FC<Props> = ({ 
  pedido, 
  onClose, 
  esVentaRapida = false 
}) => {
  if (!pedido) return null;

  // Estado para alternar la previsualización en pantalla ('cliente' o 'comanda')
  const [tipoTicket, setTipoTicket] = useState<'cliente' | 'comanda'>('cliente');

  // Mapeo seguro para el nombre del cliente
  const nombreCliente = pedido.cliente?.persona 
    ? `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
    : (pedido.cliente?.razon_social || pedido.cliente?.nombre || 'Consumidor Final');

  // Extraer empleado de la última asignación activa
  const ultimaAsignacion = pedido.asignaciones && pedido.asignaciones.length > 0 
    ? pedido.asignaciones[pedido.asignaciones.length - 1] 
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : (ultimaAsignacion?.empleado?.nombre ?? 'Sin Asignar');

  const saldoPendiente = Number(pedido.monto_total) - Number(pedido.monto_pago_adelantado);

  const handleImprimir = () => {
    const originalTitle = document.title;
    document.title = `pedido-${tipoTicket}-${pedido.id_pedido}`;
    window.print();
    document.title = originalTitle;
  };

  // Comprobar si el pedido proviene de Venta Rápida
  const esProcesoVentaRapida = esVentaRapida || pedido.estado === 'VENTA_RAPIDA';

  return (
    <div className="modal d-block show" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content bg-white text-dark p-3 rounded shadow">
          
          {/* Cabecera del Modal - Oculta al imprimir */}
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2 d-print-none">
            <h5 className="modal-title fw-bold text-secondary">Previsualizar Documento</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Selector de Tipo de Ticket - Oculto al imprimir */}
          <div className="d-flex g-2 mb-3 p-1 bg-light rounded d-print-none">
            <button 
              className={`btn btn-sm w-50 fw-bold transition-all ${tipoTicket === 'cliente' ? 'btn-dark' : 'text-secondary'}`}
              onClick={() => setTipoTicket('cliente')}
            >
              <i className="bi bi-person-fill me-1"></i> Ticket Cliente
            </button>
            <button 
              className={`btn btn-sm w-50 fw-bold transition-all ${tipoTicket === 'comanda' ? 'btn-warning text-dark' : 'text-secondary'}`}
              onClick={() => setTipoTicket('comanda')}
            >
              <i className="bi bi-journal-text me-1"></i> Comanda Taller
            </button>
          </div>

          {/* Contenedor Envolvente del Ticket Físico */}
          <div 
             id="ticket-imprimible" 
             data-bs-theme="light"
             className="p-3 font-monospace position-relative" 
             style={{ 
               fontSize: '0.88rem', 
               color: '#000',
               border: '2px dashed #333',
               borderRadius: '4px',
               backgroundColor: '#fff'
             }}
           >
            {/* Encabezado General */}
            <div className="text-center mb-3">
              <h4 className="fw-bold mb-0">EL SUR</h4>
              <small className="text-uppercase d-block fw-semibold tracking-wider">Centro de Copiado</small>
              <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>
              
              <p className="mb-0 fw-bold text-uppercase fs-6">
                {tipoTicket === 'comanda' ? '➔ COMANDA DE PRODUCCIÓN' : 'TICKET DE PEDIDO'} #{pedido.id_pedido}
              </p>
              
              <small className="d-block mt-1">
                Ingreso: {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleString('es-AR') : new Date().toLocaleString('es-AR')}
              </small>
            </div>

            {/* Datos específicos según el rol del Ticket */}
            <div className="mb-3 data-section">
              <p className="mb-1"><strong>Cliente:</strong> {nombreCliente}</p>
              
              {tipoTicket === 'comanda' && (
                <>
                  <p className="mb-1"><strong>Estado Operativo:</strong> {pedido.estado}</p>
                  <p className="mb-1"><strong>Estante/Ubicación:</strong> <span className="p-1 bg-dark text-white rounded px-2 fw-bold">{pedido.ubicacion_estante || 'Taller'}</span></p>
                  <p className="mb-1"><strong>Operario Asignado:</strong> {nombreEmpleado}</p>
                  
                  {/* Se oculta el Egreso Estimado en Venta Rápida */}
                  {!esProcesoVentaRapida && (
                    <p className="mb-1 text-danger">
                      <strong>Egreso Estimado:</strong> {pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleString('es-AR') : 'Prioritario / Sín definir'}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>

            {/* Tabla de Artículos e Insumos */}
            <table className="table table-sm table-borderless text-dark p-0" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr className="border-bottom" style={{ borderColor: '#000' }}>
                  <th style={{ width: '15%' }}>Cant</th>
                  <th>Descripción</th>
                  <th className="text-end" style={{ width: '25%' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.detalles?.map((det: any, index: number) => (
                  <tr key={index}>
                    <td className="fw-bold">{det.cantidad}</td>
                    <td>{det.producto?.nombreProducto || 'Servicio/Copia'}</td>
                    <td className="text-end">${Number(det.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>

            {/* Desglose Económico */}
            <div className="d-flex justify-content-between fw-bold fs-5 my-1">
              <span>TOTAL:</span>
              <span>${Number(pedido.monto_total).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between my-1 text-muted">
              <span>Monto Señado / Entregado:</span>
              <span>${Number(pedido.monto_pago_adelantado).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold my-1 border-top pt-1" style={{ borderColor: '#000' }}>
              <span>Saldo Restante a Pagar:</span>
              <span className={saldoPendiente > 0 ? "text-decoration-underline" : ""}>
                ${saldoPendiente.toFixed(2)}
              </span>
            </div>

            {/* Bloque Único de Observaciones / Instrucciones del taller */}
            {pedido.observaciones && (
              <div className="mt-3 p-2 rounded" style={{ border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                <strong style={{ fontSize: '0.75rem' }} className="d-block text-uppercase text-dark">Instrucciones Adicionales (Taller):</strong>
                <p className="mb-0 lh-sm text-dark font-monospace fw-bold" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {pedido.observaciones}
                </p>
              </div>
            )}

            {/* Pie de Página Dinámico */}
            <div className="text-center mt-4 border-top pt-2" style={{ borderTop: '1px dashed #000' }}>
              {tipoTicket === 'cliente' ? (
                <small className="d-block fw-bold">¡Gracias por su confianza en El Sur!</small>
              ) : (
                <small className="d-block fw-bold text-uppercase bg-dark text-white p-1">Uso Exclusivo del Personal Interno</small>
              )}
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>Sistemas El Sur v2.0</small>
            </div>
          </div>

          {/* Acciones de Control - Ocultas al imprimir */}
          <div className="d-flex justify-content-between mt-4 border-top pt-2 d-print-none">
            <button className="btn btn-secondary px-3" onClick={onClose}>
              Cerrar
            </button>
            <button 
              className={`btn px-4 fw-bold text-white`} 
              style={{ backgroundColor: tipoTicket === 'comanda' ? '#d97706' : '#3d824b', border: 'none' }} 
              onClick={handleImprimir}
            >
              <i className="bi bi-printer-fill me-2"></i> Imprimir {tipoTicket === 'comanda' ? 'Comanda' : 'Ticket'}
            </button>
          </div>

        </div>
      </div>

      {/* Driver de control de Impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-imprimible, #ticket-imprimible * {
            visibility: visible;
          }
          #ticket-imprimible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0;
            margin: 0;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};