import React from 'react';

interface ModalAuditoriaPedidoProps {
  pedido: any;
  onClose: () => void;
}

export const ModalAuditoriaPedido: React.FC<ModalAuditoriaPedidoProps> = ({ pedido, onClose }) => {
  if (!pedido) return null;
  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '1100px', width: '95%' }}>
        <div className="modal-content" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46', borderRadius: '12px' }}>
          
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: '#8e45e0' }}>
              <i className="bi bi-shield-check me-2"></i>Auditoría Integral #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-4">
              
              {/* HISTORIAL DE COBROS */}
             <div className="col-md-5">
             <h6 className="text-uppercase small mb-3" style={{ color: '#22c55e', letterSpacing: '1px' }}>
             <i className="bi bi-cash-stack me-2"></i>Historial de Cobros</h6>
             <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
             {pedido.comprobantes && pedido.comprobantes.length > 0 ?
             (
             <table className="table-sm align-middle small text-white" style={{ backgroundColor: '#1a1a1c', borderCollapse: 'collapse', width: '100%' }}>
  <thead>
    <tr style={{ borderBottom: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase' }}>
      <th className="px-3 py-2">ID Pago</th>
      <th className="py-2">Tipo</th>
      <th className="text-center py-2">Acción</th> 
      <th className="text-end px-3 py-2">Monto</th>
    </tr>
  </thead>
  <tbody>
    {/* ➔ ORDENADOS CRONOLÓGICAMENTE DE MENOR A MAYOR FECHA/HORA */}
    {[...pedido.comprobantes]
      .sort((a, b) => new Date(a.fechaCarga).getTime() - new Date(b.fechaCarga).getTime())
      .map((pago: any, idx: number) => (
      <tr key={idx} style={{ borderBottom: '1px solid #27272a' }}>
        <td className="px-3 py-3 font-monospace">#{pago.id_comprobante || idx + 1}</td>
        <td className="py-3">
          <span className="badge" style={{ backgroundColor: '#27272a', color: '#a1a1aa' }}>{pago.tipoPago || 'EFECTIVO'}</span>
        </td>
        <td className="text-center py-3">{pago.urlArchivoComprobante && (<a href={`http://localhost:8080${pago.urlArchivoComprobante}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" 
         title="Ver comprobante" 
         style={{ 
         backgroundColor: 'transparent', 
         border: '1px solid #0dcaf0', 
         color: '#0dcaf0', 
         padding: '2px 8px', 
         borderRadius: '4px', 
         fontSize: '0.9rem', 
         textDecoration: 'none' 
        }}>
      <i className="bi bi-eye-fill"></i>
    </a>
  )}
</td>
        <td className="text-end px-3 py-3 fw-bold text-success font-monospace">+${Number(pago.montoPago || 0).toFixed(2)}</td>
      </tr>
    ))}
  </tbody>
</table>
    ) : (
      <div className="p-3 text-center border border-secondary rounded" style={{ backgroundColor: '#121214', fontSize: '0.8rem' }}>
        Sin cobros registrados.
      </div>
      )}
      </div>

                <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#121214', border: '1px solid #3f3f46' }}>
                  <div className="d-flex justify-content-between mb-1 text-white"><span>Total:</span> <span className="fw-bold">${Number(pedido.monto_total || 0).toFixed(2)}</span></div>
                  <div className="d-flex justify-content-between mb-1 text-white"><span>Abonado:</span> <span className="text-info fw-bold">${Number(pedido.monto_pago_adelantado || 0).toFixed(2)}</span></div>
                  <div className="d-flex justify-content-between pt-2 border-top border-secondary text-white">
                    <span>Saldo:</span> <span className="text-danger fw-bold">${Number((pedido.monto_total || 0) - (pedido.monto_pago_adelantado || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ESTADOS Y MENSAJES */}
              <div className="col-md-7">
                <h6 className="text-uppercase small mb-3" style={{ color: '#eab308', letterSpacing: '1px' }}>
                  <i className="bi bi-journal-text me-2"></i>Estados y Mensajes
                </h6>

                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  {pedido.historiales?.map((hist: any, index: number) => (
                    <div key={index} className="mb-3 p-3 rounded" style={{ backgroundColor: '#121214', borderLeft: '3px solid #eab308' }}>
                      <div className="d-flex justify-content-between small text-white mb-1">
                        <span>{new Date(hist.fecha_cambio).toLocaleDateString()}</span>
                        <span>Responsable: {hist.usuarioResponsable?.persona?.nombre || 'Sistema'}</span>
                      </div>
                      <div className="fw-bold mb-1 text-white">
                        <span style={{ color: '#696969' }}>{hist.estado_anterior}</span> ➔ <span style={{ color: '#eab308' }}>{hist.estado_nuevo}</span>
                      </div>
                      {hist.observaciones && <div className="small text-white-50 fst-italic">"{hist.observaciones}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button className="btn btn-secondary px-4" onClick={onClose}>Cerrar Auditoría</button>
          </div>
        </div>
      </div>
    </div>
  );
};