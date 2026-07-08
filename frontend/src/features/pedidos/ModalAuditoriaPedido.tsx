import React from 'react';

interface ModalAuditoriaPedidoProps {
  pedido: any;
  onClose: () => void;
}

export const ModalAuditoriaPedido: React.FC<ModalAuditoriaPedidoProps> = ({ pedido, onClose }) => {
  if (!pedido) return null;

  return (
    <div className="modal d-block animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary shadow-lg">
          
          {/* Header del Modal */}
          <div className="modal-header border-secondary bg-black bg-gradient">
            <h5 className="modal-title text-info fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-shield-check"></i> Auditoría Integral de Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body p-4">
            <div className="row g-4">
              
              {/* COLUMNA IZQUIERDA: HISTORIAL DE COBROS (COMPROBANTES) */}
              <div className="col-md-5 border-end border-secondary pe-3">
                <h6 className="text-success fw-bold font-monospace text-uppercase small tracking-wider mb-3 d-flex align-items-center gap-1">
                  <i className="bi bi-cash-stack"></i> Historial de Cobros
                </h6>
                
                <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="pe-1">
                  {pedido.comprobantes && pedido.comprobantes.length > 0 ? (
                    <table className="table table-dark table-sm table-borderless align-middle small mb-0">
                      <thead>
                        <tr className="border-bottom border-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
                          <th className="text-white-50">ID Pago</th>
                          <th className="text-white-50">Método / Tipo</th>
                          <th className="text-end text-white-50">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedido.comprobantes.map((pago: any, idx: number) => (
                          <tr key={`pago-${pago.id_comprobante || idx}`} className="border-bottom border-dark">
                            <td className="text-white-50 font-monospace py-2">
                              #{pago.id_comprobante || idx + 1}
                            </td>
                            <td className="py-2 small">
                              {/* Forzamos text-white explícito para que no herede negro de Bootstrap */}
                              <span className="badge bg-black border border-secondary text-white font-monospace text-uppercase me-2">
                                {pago.tipoPago || 'EFECTIVO'}
                              </span>
                              
                              {/* El Ojito: Solo aparece si existe un archivo/captura adjunta */}
                              {pago.urlArchivoComprobante && pago.urlArchivoComprobante.trim() !== "" && (
                                <a 
                                  href={pago.urlArchivoComprobante} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm btn-outline-info py-0 px-1 d-inline-flex align-items-center"
                                  title="Ver comprobante de transferencia"
                                  style={{ height: '20px' }}
                                >
                                  <i className="bi bi-eye-fill" style={{ fontSize: '0.85rem' }}></i>
                                </a>
                              )}
                            </td>
                            <td className="text-end fw-bold text-success py-2 font-monospace">
                              {/* ➔ CORRECCIÓN CLAVE: Lee montoPago que viene desde la base de datos */}
                              +${Number(pago.montoPago || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 my-2 rounded bg-black bg-opacity-20 border border-secondary border-dashed">
                      <p className="text-white-50 font-monospace small mb-0">
                        No se registran entregas parciales ni señas cargadas.
                      </p>
                    </div>
                  )}
                </div>

                {/* Resumen de totales al pie con clases de visibilidad forzadas */}
                <div className="mt-3 p-2 rounded bg-black bg-gradient border border-secondary small font-monospace">
                  <div className="d-flex justify-content-between text-white-50">
                    <span>Monto Total:</span>
                    <span className="text-white fw-bold">${Number(pedido.monto_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-white-50 mt-1">
                    <span>Total Abonado:</span>
                    <span className="text-info fw-bold">${Number(pedido.monto_pago_adelantado || 0).toFixed(2)}</span>
                  </div>
                  <hr className="my-1 border-secondary" />
                  <div className="d-flex justify-content-between text-white-50">
                    <span>Restante / Saldo:</span>
                    <span className={`fw-bold ${((pedido.monto_total || 0) - (pedido.monto_pago_adelantado || 0)) <= 0 ? 'text-success' : 'text-danger'}`}>
                      ${Number((pedido.monto_total || 0) - (pedido.monto_pago_adelantado || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: HISTORIAL DE ESTADOS Y NOTAS DEL TALLER */}
              <div className="col-md-7 ps-3">
                <h6 className="text-warning fw-bold font-monospace text-uppercase small tracking-wider mb-3 d-flex align-items-center gap-1">
                  <i className="bi bi-journal-text"></i> Estados y Mensajes del Taller
                </h6>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="pe-1">
                  {pedido.historiales && pedido.historiales.length > 0 ? (
                    <div className="position-relative border-start border-secondary ms-2 ps-3 py-1">
                      {pedido.historiales.map((hist: any, index: number) => {
                        const operador = hist.usuarioResponsable?.nombre_usuario || 'Operador';
                        return (
                          <div key={`auditoria-hist-${hist.id_historial || index}`} className="mb-4 position-relative">
                            <span 
                              className="position-absolute bg-info rounded-circle shadow" 
                              style={{ width: '10px', height: '10px', left: '-21px', top: '5px', border: '2px solid #212529' }}
                            ></span>
                            
                            <div className="small text-white-50 font-monospace" style={{ fontSize: '0.78rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              {hist.fecha_cambio ? new Date(hist.fecha_cambio).toLocaleString('es-AR') : 'Sin Fecha'}
                            </div>

                            <div className="fw-semibold text-white small mt-1">
                              Flujo: <span className="text-white-50 font-monospace bg-black px-1 rounded small">{hist.estado_anterior}</span> 
                              <span className="text-info mx-1">➔</span> 
                              <span className="text-warning font-monospace bg-black px-1 rounded small">{hist.estado_nuevo}</span>
                            </div>

                            <div className="small text-white-50 mt-1" style={{ fontSize: '0.8rem' }}>
                              <i className="bi bi-person-circle text-muted me-1"></i>
                              Responsable: <span className="text-info font-monospace">{operador}</span>
                            </div>

                            {hist.observaciones && hist.observaciones.trim() !== "" ? (
                              <div 
                                className="text-warning font-monospace small mt-2 p-2 rounded border-start border-warning border-3 bg-black" 
                                style={{ fontSize: '0.8rem', lineHeight: '1.3' }}
                              >
                                "{hist.observaciones}"
                              </div>
                            ) : (
                              <div className="text-white-50 font-monospace small mt-1 italic ps-2 style-italic" style={{ fontSize: '0.75rem', transform: 'skewX(-10deg)' }}>
                                Sin comentarios adicionales del operador.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 my-2 rounded bg-black bg-opacity-20 border border-secondary border-dashed">
                      <p className="text-white-50 font-monospace small mb-0">
                        Sin cambios de estado ni registros en la auditoría de este pedido.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Footer del Modal */}
          <div className="modal-footer border-secondary bg-black bg-opacity-40">
            <button type="button" className="btn btn-secondary font-monospace px-4 btn-sm" onClick={onClose}>
              Cerrar Auditoría
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};