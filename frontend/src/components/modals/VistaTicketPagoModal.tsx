import React from 'react';

interface Props {
  pedido: any;
  tipo?: 'cliente' | 'pago';
  movimiento?: any;
  onClose: () => void;
  esVentaRapida?: boolean;
}

export const VistaTicketPagoModal: React.FC<Props> = ({ pedido, movimiento, onClose, esVentaRapida = false }) => {
  if (!pedido) return null;

  // Detectar si el movimiento es un egreso o compra de insumos
  const esEgreso = 
    movimiento?.tipoMovimiento === 'EGRESO' || 
    movimiento?.categoria === 'INSUMOS' || 
    movimiento?.categoria === 'EGRESO_MANTENIMIENTO';

  const nombreCliente = pedido.cliente?.persona 
    ? `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
    : (pedido.cliente?.razon_social || pedido.cliente?.nombre || 'Consumidor Final');

  const totalPedido = Number(pedido.monto_total ?? 0);
  const montoEsteCobro = Number(movimiento?.monto ?? movimiento?.montoPago ?? movimiento?.monto_pago ?? 0);

  // Cálculo de abonado histórico acumulativo (exclusivo para ingresos/ventas)
  const listaPagos = (pedido.comprobantes || pedido.pagos || pedido.movimientos || [])
    .slice()
    .sort((a: any, b: any) => {
      const fechaA = new Date(a.fechaCarga ?? a.fecha_carga ?? a.fecha ?? 0).getTime();
      const fechaB = new Date(b.fechaCarga ?? b.fecha_carga ?? b.fecha ?? 0).getTime();
      return fechaA - fechaB;
    });

  let montoAbonadoTotalMomento = 0;

  if (esVentaRapida) {
    montoAbonadoTotalMomento = totalPedido;
  } else if (movimiento && listaPagos.length > 0) {
    const idMovimientoBuscado = movimiento.id ?? movimiento.id_comprobante ?? movimiento.idComprobante;
    const fechaMovimientoBuscado = movimiento.fecha ? new Date(movimiento.fecha).getTime() : 0;

    let sumaAcumulada = 0;
    let encontrado = false;

    for (const p of listaPagos) {
      const idP = p.id ?? p.id_comprobante ?? p.idComprobante;
      const fechaP = new Date(p.fechaCarga ?? p.fecha_carga ?? p.fecha ?? 0).getTime();
      const montoP = Number(p.montoPago ?? p.monto_pago ?? p.monto ?? 0);

      sumaAcumulada += montoP;

      if ((idMovimientoBuscado !== undefined && idMovimientoBuscado !== null && idP === idMovimientoBuscado) || 
          (fechaMovimientoBuscado > 0 && fechaP === fechaMovimientoBuscado)) {
        montoAbonadoTotalMomento = sumaAcumulada;
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      montoAbonadoTotalMomento = Number(pedido.monto_pago_adelantado ?? pedido.montoAbonado ?? 0);
    }
  } else {
    montoAbonadoTotalMomento = Number(pedido.monto_pago_adelantado ?? pedido.montoAbonado ?? 0);
  }

  const saldoPendienteMomento = Math.max(0, totalPedido - montoAbonadoTotalMomento);

  const handleImprimir = () => {
    const originalTitle = document.title;
    document.title = esEgreso 
      ? `comprobante-egreso-${movimiento?.id_movimiento || movimiento?.idMovimiento || 'caja'}`
      : `ticket-pago-${pedido.id_pedido || pedido.idPedido}`;
    window.print();
    document.title = originalTitle;
  };

  const idMov = movimiento?.id_movimiento || movimiento?.idMovimiento;
  const numReferencia = pedido.id_pedido && pedido.id_pedido !== '-' 
    ? `Pedido N°: #${pedido.id_pedido}` 
    : (idMov ? `Movimiento N°: #${idMov}` : '');

  return (
    <div className="modal d-block show" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content bg-white text-dark p-4 rounded shadow-lg">
          
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2 d-print-none">
            <h5 className="modal-title fw-bold text-secondary">
              {esEgreso ? 'Comprobante de Egreso (Caja)' : 'Comprobante de Pago (Caja)'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div 
            id="ticket-pago-imprimible" 
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
              <small className="text-uppercase d-block fw-semibold">Centro de Copiado & Gráfica</small>
              <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>
              
              <p className="mb-0 fw-bold text-uppercase fs-6">
                {esEgreso ? 'COMPROBANTE DE EGRESO' : 'COMPROBANTE DE PAGO'}
              </p>
              
              {numReferencia && <small className="d-block fw-bold mt-1">{numReferencia}</small>}
              <small className="d-block">
                Fecha: {movimiento?.fecha ? new Date(movimiento.fecha).toLocaleString('es-AR') : new Date().toLocaleString('es-AR')}
              </small>
            </div>

            <div className="mb-3">
              {esEgreso ? (
                <>
                  <p className="mb-1"><strong>Categoría:</strong> {movimiento?.categoria || 'EGRESO'}</p>
                  <p className="mb-1"><strong>Método de Pago:</strong> {movimiento?.metodoPago || 'EFECTIVO'}</p>
                  <p className="mb-1 fw-bold text-danger">
                    <strong>Tipo:</strong> EGRESO DE CAJA
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-1"><strong>Cliente:</strong> {nombreCliente}</p>
                  <p className="mb-1"><strong>Método de Pago:</strong> {movimiento?.metodoPago || 'EFECTIVO'}</p>
                  <p className={`mb-1 fw-bold ${saldoPendienteMomento === 0 ? 'text-success' : 'text-warning'}`}>
                    <strong>Estado Pedido:</strong> {saldoPendienteMomento === 0 ? 'PAGADO TOTAL' : 'PAGO PARCIAL'}
                  </p>
                </>
              )}
            </div>

            <div className="border-bottom border-dashed my-2" style={{ borderColor: '#000' }}></div>

            <div className="py-1">
              {esEgreso ? (
                <div className="d-flex justify-content-between fw-bold text-danger fs-6 my-2 p-2 rounded" style={{ border: '1.5px solid #dc3545', backgroundColor: '#f8d7da' }}>
                  <span>MONTO EGRESO:</span>
                  <span>-${montoEsteCobro.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  {montoEsteCobro > 0 && (
                    <div className="d-flex justify-content-between fw-bold text-success fs-6 my-2 p-2 rounded" style={{ border: '1.5px solid #198754', backgroundColor: '#f0fdf4' }}>
                      <span>MONTO DE ESTE PAGO:</span>
                      <span>${montoEsteCobro.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between my-1" style={{ fontSize: '0.8rem' }}>
                    <span>Monto Total Pedido:</span>
                    <span>${totalPedido.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between my-1" style={{ fontSize: '0.8rem' }}>
                    <span>Total Acumulado Abonado:</span>
                    <span>${montoAbonadoTotalMomento.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold my-1 text-dark">
                    <span>Saldo Pendiente Actual:</span>
                    <span>${saldoPendienteMomento.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {(movimiento?.descripcion || pedido.observaciones) && (
              <div className="mt-3 p-2 rounded" style={{ border: '1px solid #000', backgroundColor: '#f9f9f9' }}>
                <strong style={{ fontSize: '0.75rem' }} className="d-block text-uppercase text-dark">
                  {esEgreso ? 'Detalle / Concepto:' : 'Observaciones:'}
                </strong>
                <p className="mb-0 lh-sm text-dark font-monospace fw-bold" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                  {movimiento?.descripcion || pedido.observaciones}
                </p>
              </div>
            )}

            <div className="text-center mt-4 border-top pt-2" style={{ borderTop: '1px dashed #000' }}>
              <small className="d-block fw-bold">
                {esEgreso ? 'Comprobante interno de caja' : '¡Gracias por su compra!'}
              </small>
              <small className="d-block mt-1" style={{ fontSize: '0.65rem' }}>
                {esEgreso ? 'Conserve este ticket como respaldo de salida de dinero.' : 'Conserve este ticket como comprobante de caja.'}
              </small>
            </div>
          </div>

          <div className="d-flex justify-content-between mt-4 border-top pt-2 d-print-none">
            <button className="btn btn-secondary px-3" onClick={onClose}>
              Cerrar
            </button>
            <button 
              className={`btn ${esEgreso ? 'btn-danger' : 'btn-success'} px-4 fw-bold text-white`} 
              onClick={handleImprimir}
            >
              <i className="bi bi-printer-fill me-2"></i>
              {esEgreso ? 'Imprimir Comprobante Egreso' : 'Imprimir Ticket Pago'}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-pago-imprimible, #ticket-pago-imprimible * {
            visibility: visible;
          }
          #ticket-pago-imprimible {
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