import React, { useState } from 'react';

interface Props {
  pedido: any;
  onClose: () => void;
  esVentaRapida?: boolean; // <--- Prop opcional para no afectar otros módulos
}

export const VistaTicketModal: React.FC<Props> = ({ pedido, onClose, esVentaRapida = false }) => {
  if (!pedido) return null;

  const [tipoTicket, setTipoTicket] = useState<'cliente' | 'comanda'>('cliente');

  const nombreCliente = pedido.cliente?.persona 
    ? `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
    : (pedido.cliente?.razon_social || pedido.cliente?.nombre || 'Consumidor Final');

  const ultimaAsignacion = pedido.asignaciones && pedido.asignaciones.length > 0 
    ? pedido.asignaciones[pedido.asignaciones.length - 1] 
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : (ultimaAsignacion?.empleado?.nombre ?? 'Sin Asignar');

  const montoTotal = Number(pedido.monto_total) || 0;
  
  // Si es venta rápida forzamos el abonado al total, si no, leemos el real del pedido (señas/pagos parciales)
  const montoAbonado = esVentaRapida 
    ? montoTotal 
    : Number(pedido.monto_pago_adelantado ?? pedido.montoAbonado ?? 0);
  
  const saldoPendiente = Math.max(0, montoTotal - montoAbonado);

  const handleImprimir = () => {
    const originalTitle = document.title;
    document.title = `pedido-${tipoTicket}-${pedido.id_pedido || pedido.idPedido}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="modal d-block show" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content bg-white text-dark p-3 rounded shadow">
          
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2 d-print-none">
            <h5 className="modal-title fw-bold text-secondary">Previsualizar Documento (Cliente)</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

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

          <div 
            id="ticket-imprimible" 
            className="p-3 font-monospace position-relative" 
            style={{ 
              fontSize: '0.88rem', 
              color: '#000',
              border: '2px dashed #333',
              borderRadius: '4px',
              backgroundColor: '#fff'
            }}
          >
            <div className="text-center mb-3">
              <h4 className="fw-bold mb-0">EL SUR</h4>
              <small className="text-uppercase d-block fw-semibold tracking-wider">Centro de Copiado</small>
              <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>
              
              <p className="mb-0 fw-bold text-uppercase fs-6">
                {tipoTicket === 'comanda' ? '➔ COMANDA DE PRODUCCIÓN' : (esVentaRapida ? 'TICKET DE VENTA RÁPIDA' : 'TICKET DE PEDIDO')} #{pedido.id_pedido || pedido.idPedido}
              </p>
              
              <small className="d-block mt-1">
                Ingreso: {pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleString('es-AR') : new Date().toLocaleString('es-AR')}
              </small>
            </div>

            <div className="mb-3 data-section">
              <p className="mb-1"><strong>Cliente:</strong> {nombreCliente}</p>
              <p className={`mb-1 fw-bold ${saldoPendiente === 0 ? 'text-success' : 'text-warning'}`}>
                <strong>Estado del Pago:</strong> {saldoPendiente === 0 ? 'PAGADO (CONTADO)' : `PAGO PARCIAL (Resta $${saldoPendiente.toFixed(2)})`}
              </p>
              
              {tipoTicket === 'comanda' && (
                <>
                  <p className="mb-1"><strong>Estado Operativo:</strong> {pedido.estado || 'FINALIZADO'}</p>
                  <p className="mb-1"><strong>Estante/Ubicación:</strong> <span className="p-1 bg-dark text-white rounded px-2 fw-bold">{pedido.ubicacion_estante || 'Entrega Inmediata'}</span></p>
                  <p className="mb-1"><strong>Operario Asignado:</strong> {nombreEmpleado}</p>
                </>
              )}
            </div>

            <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>

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

            <div className="d-flex justify-content-between fw-bold fs-5 my-1">
              <span>TOTAL:</span>
              <span>${montoTotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between my-1 text-success fw-bold">
              <span>Abonado:</span>
              <span>${montoAbonado.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold my-1 border-top pt-1 text-dark" style={{ borderColor: '#000' }}>
              <span>Saldo Restante:</span>
              <span>${saldoPendiente.toFixed(2)}</span>
            </div>

            {pedido.observaciones && (
              <div className="mt-3 p-2 rounded" style={{ border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                <strong style={{ fontSize: '0.75rem' }} className="d-block text-uppercase text-dark">Observaciones:</strong>
                <p className="mb-0 lh-sm text-dark font-monospace fw-bold" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {pedido.observaciones}
                </p>
              </div>
            )}

            <div className="text-center mt-4 border-top pt-2" style={{ borderTop: '1px dashed #000' }}>
              {tipoTicket === 'cliente' ? (
                <small className="d-block fw-bold">¡Gracias por su confianza en El Sur!</small>
              ) : (
                <small className="d-block fw-bold text-uppercase bg-dark text-white p-1">Uso Exclusivo del Personal Interno</small>
              )}
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>Sistemas El Sur v2.0</small>
            </div>
          </div>

          <div className="d-flex justify-content-between mt-4 border-top pt-2 d-print-none">
            <button className="btn btn-secondary px-3" onClick={onClose}>
              Cerrar
            </button>
            <button 
              className="btn px-4 fw-bold text-white" 
              style={{ backgroundColor: tipoTicket === 'comanda' ? '#d97706' : '#3d824b', border: 'none' }} 
              onClick={handleImprimir}
            >
              <i className="bi bi-printer-fill me-2"></i> Imprimir {tipoTicket === 'comanda' ? 'Comanda' : 'Ticket'}
            </button>
          </div>

        </div>
      </div>

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