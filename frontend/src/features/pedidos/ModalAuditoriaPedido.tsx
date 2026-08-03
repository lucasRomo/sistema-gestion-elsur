import React from 'react';

interface ModalAuditoriaPedidoProps {
  pedido: any;
  onClose: () => void;
  onAbrirCuentaCorriente?: (cliente: any) => void; // <--- 1. Agregamos esta prop opcional
}

export const ModalAuditoriaPedido: React.FC<ModalAuditoriaPedidoProps> = ({ pedido, onClose, onAbrirCuentaCorriente }) => {
  if (!pedido) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '1100px', width: '95%' }}>
        <div className="modal-content" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46', borderRadius: '12px' }}>
          
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: '#00f2fe' }}>
              <i className="bi bi-shield-check me-2"></i>Auditoría Integral de Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-4">
              
              {/* HISTORIAL DE COBROS */}
              <div className="col-md-5">
                <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#25d164', letterSpacing: '1px' }}>
                  <i className="bi bi-cash-stack me-2"></i>Historial de Cobros
                </h6>

                {/* LEYENDA Y BOTÓN DE CUENTA CORRIENTE */}
                {pedido.es_cuenta_corriente && (
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div 
                      className="font-monospace fw-bold" 
                      style={{ color: '#25d164', fontSize: '0.8rem' }}
                    >
                      Pago Vinculada a Cuenta Corriente
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
                      style={{ backgroundColor: '#198d43', border: 'none', borderRadius: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => {
                        if (onAbrirCuentaCorriente) {
                          onAbrirCuentaCorriente(pedido.cliente);
                        }
                      }}
                      title="Ver detalle de Cuenta Corriente del Cliente"
                    >
                      <i className="bi bi-wallet2"></i> Ver Cuenta Corriente
                    </button>
                  </div>
                )}

                <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
                  {pedido.comprobantes && pedido.comprobantes.length > 0 ? (
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
                        {[...pedido.comprobantes]
                          .sort((a, b) => new Date(a.fechaCarga).getTime() - new Date(b.fechaCarga).getTime())
                          .map((pago: any, idx: number, arrayOriginal: any[]) => {
                            const esUnico = arrayOriginal.length === 1;
                            const esPrimero = idx === 0;

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #27272a' }}>
                                <td className="px-3 py-3 font-monospace">#{pago.id_comprobante || idx + 1}</td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge" style={{ backgroundColor: '#27272a', color: '#a1a1aa' }}>{pago.tipoPago || 'EFECTIVO'}</span>
                                    
                                    {esUnico ? (
                                      <span className="badge" style={{ backgroundColor: 'rgba(13, 202, 240, 0.2)', color: '#0dcaf0', border: '1px solid #0dcaf0' }}>Total</span>
                                    ) : esPrimero ? (
                                      <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid #22c55e' }}>Seña Inicial</span>
                                    ) : (
                                      <span className="badge" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}>Pago Parcial</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-3">
                                  <div className="d-flex justify-content-center align-items-center gap-1">
                                    {pago.urlArchivoComprobante && (
                                      <a 
                                        href={`http://localhost:8080${pago.urlArchivoComprobante}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-sm" 
                                        title="Ver comprobante" 
                                        style={{ 
                                          backgroundColor: 'transparent', 
                                          border: '1px solid #0dcaf0', 
                                          color: '#0dcaf0', 
                                          padding: '2px 8px', 
                                          borderRadius: '4px', 
                                          fontSize: '0.9rem', 
                                          textDecoration: 'none' 
                                        }}
                                      >
                                        <i className="bi bi-eye-fill"></i>
                                      </a>
                                    )}

                                    {pago.tipoPago === 'CUENTA_CORRIENTE' && (
                                      <button 
                                        onClick={() => {
                                          // 2. Invocamos la función pasando el objeto cliente asociado al pedido
                                          if (onAbrirCuentaCorriente) {
                                            onAbrirCuentaCorriente(pedido.cliente);
                                          }
                                        }}
                                        className="btn btn-sm" 
                                        title="Ver detalle de Cuenta Corriente" 
                                        style={{ 
                                          backgroundColor: 'transparent', 
                                          border: '1px solid #ffc107', 
                                          color: '#ffc107', 
                                          padding: '2px 8px', 
                                          borderRadius: '4px', 
                                          fontSize: '0.9rem' 
                                        }}
                                      >
                                        <i className="bi bi-file-earmark-text-fill"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="text-end px-3 py-3 fw-bold text-success font-monospace">+${Number(pago.montoPago || 0).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-center border border-secondary rounded text-white-50" style={{ backgroundColor: '#121214', fontSize: '0.85rem' }}>
                      No se registran entregas parciales ni señas cargadas.
                    </div>
                  )}
                </div>

                <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#121214', border: '1px solid #3f3f46' }}>
                  <div className="d-flex justify-content-between mb-1 text-white"><span>Monto Total:</span> <span className="fw-bold">${Number(pedido.monto_total || 0).toFixed(2)}</span></div>
                  <div className="d-flex justify-content-between mb-1 text-white"><span>Total Abonado:</span> <span className="text-info fw-bold">${Number(pedido.monto_pago_adelantado || 0).toFixed(2)}</span></div>
                  <div className="d-flex justify-content-between pt-2 border-top border-secondary text-white">
                    <span>Restante / Saldo:</span> <span className="text-success fw-bold">${Number((pedido.monto_total || 0) - (pedido.monto_pago_adelantado || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

             <div className="col-md-7">
              <h6 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2 font-monospace">
             <i className="bi bi-journal-text"></i> ESTADOS Y MENSAJES DEL TALLER</h6>
             <div className="historial-timeline pe-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
             {pedido.historiales && pedido.historiales.length > 0 ? (
              pedido.historiales.map((hist: any, index: number) => {
              const estAnt = hist.estado_anterior || '';
              const estNuv = hist.estado_nuevo || '';
              const esAsignacion = estAnt.startsWith('ASIGNADO:') || estNuv.startsWith('ASIGNADO:');
              const esCancelado = estNuv.includes('CANCELADO');
              const esEntregado = estNuv.includes('ENTREGADO');
              let colorTema = '#ffc107';
              let iconoEvento = 'bi-arrow-repeat';
              let etiqueta = 'Flujo:';
              if (esAsignacion) {
              colorTema = '#852ddd'; 
              iconoEvento = 'bi-person-gear';
              etiqueta = 'Asignación:';
              } else if (esCancelado) {
              colorTema = '#ef4444'; 
              iconoEvento = 'bi-x-circle';
              etiqueta = 'Flujo:';
              } else if (esEntregado) {
              colorTema = '#00d2ff'; 
              iconoEvento = 'bi-check-all';
              etiqueta = 'Flujo:';}
              const textoAnterior = esAsignacion ? estAnt.replace('ASIGNADO: ', '') : estAnt;
              const textoNuevo = esAsignacion ? estNuv.replace('ASIGNADO: ', '') : estNuv;
              const esUltimo = index === pedido.historiales.length - 1;
             return (
            <div key={`hist-${hist.id_historial || index}`} className="d-flex gap-3 position-relative pb-4">
            <div className="d-flex flex-column align-items-center flex-shrink-0 position-relative" style={{ width: '16px' }}>
              {!esUltimo && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '12px',
                    bottom: '-28px',
                    left: '7px',
                    width: '2px',
                    backgroundColor: '#3f3f46',
                    zIndex: 0
                  }}
                />
              )}
              <div 
                className="rounded-circle mt-1 position-relative"
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: colorTema,
                  boxShadow: `0 0 6px ${colorTema}`,
                  zIndex: 1
                }}
              />
            </div>
            <div className="flex-grow-1">
              {/* Fecha y Hora */}
              <div className="text-secondary font-monospace small mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.80rem' }}>
                <i className="bi bi-clock"></i>
                {new Date(hist.fecha_cambio).toLocaleString('es-AR', {
                  day: 'numeric', month: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </div>
              <div className="fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.95rem' }}>
                <i className={`bi ${iconoEvento} me-1`} style={{ color: colorTema }}></i>
                <span className="text-white">{etiqueta}</span>
                <span className="fw-semibold ms-1" style={{ color: '#a1a1aa' }}>{textoAnterior}</span>
                <i className="bi bi-arrow-right text-white mx-1"></i>
                <span className="fw-bold" style={{ color: colorTema }}>{textoNuevo}</span>
              </div>
              <div className="small font-monospace mt-1" style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                Responsable:{' '}
                <span className="fw-semibold" style={{ color: colorTema }}>
                  {hist.usuarioResponsable?.persona 
                    ? `${hist.usuarioResponsable.persona.nombre} ${hist.usuarioResponsable.persona.apellido}` 
                    : (hist.usuarioResponsable?.nombre_usuario || 'Lisandro')}
                </span>
              </div>
              {hist.observaciones && (
                <div 
                  className="p-2 rounded mt-2 font-monospace"
                  style={{
                    backgroundColor: '#121214',
                    borderLeft: `3px solid ${colorTema}`,
                    color: colorTema,
                    fontSize: '0.83rem'
                  }}>
                  "{hist.observaciones}"
                </div>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div className="text-muted font-monospace py-4 text-center">
        No se registran cambios de estado ni asignaciones para este pedido.
      </div>
    )}
  </div>
</div>
   </div>
    </div>
        <div className="modal-footer border-0">
            <button className="btn btn-secondary px-4 fw-semibold" onClick={onClose} style={{ backgroundColor: '#3f3f46', border: 'none' }}>
              Cerrar Auditoría
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};