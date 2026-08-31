import React, { useRef, useState } from 'react';

interface ModalGestionarComprobantesProps {
  pedido: any;
  onClose: () => void;
  onVincularComprobante: (idComprobante: number, archivo: File) => Promise<void>;
  onEliminarComprobante: (idComprobante: number) => Promise<void>;
  onVerTicket?: (pedido: any, cobro?: any) => void;
}

const formatearFechaYHora = (fechaStr: string) => {
  if (!fechaStr) return "-";
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return fechaStr;
  
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${anio} - ${horas}:${minutos} hs`;
};

export const ModalGestionarComprobantes: React.FC<ModalGestionarComprobantesProps> = ({
  pedido,
  onClose,
  onVincularComprobante,
  onEliminarComprobante,
  onVerTicket
}) => {
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && comprobanteSeleccionado !== null) {
      const archivo = e.target.files[0];
      await onVincularComprobante(comprobanteSeleccionado, archivo);
      setComprobanteSeleccionado(null);
    }
  };

  const abrirSelectorArchivo = (idComprobante: number) => {
    setComprobanteSeleccionado(idComprobante);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const listaComprobantes = pedido?.comprobantes || pedido?.pagos || pedido?.movimientos || [];

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content custom-card" 
          style={{ 
            backgroundColor: 'var(--bs-body-bg, #1a1a1c)', 
            border: '2px solid #16b5d1', 
            borderRadius: '12px' 
          }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: '#16b5d1', fontFamily: 'monospace' }}>
              Gestionar Comprobantes - Pedido #{pedido?.id_pedido ?? pedido?.idPedido ?? pedido?.id}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p className="small mb-4 text-body-secondary" style={{ fontFamily: 'monospace' }}>
              A continuación se listan los cobros realizados para este pedido. Podés vincular comprobantes, imprimirlos o eliminar registros.
            </p>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr style={{ fontFamily: 'monospace' }}>
                    <th>Monto Cobrado</th>
                    <th>Fecha y Hora</th>
                    <th>Método de Pago</th>
                    <th className="text-center">Comprobante / Acciones</th>
                  </tr>
                </thead>
                <tbody style={{ fontFamily: 'monospace' }}>
                  {listaComprobantes.length > 0 ? (
                    [...listaComprobantes]
                    .sort((a, b) => {
                      const fechaA = new Date(a.fechaCarga ?? a.fecha_carga ?? a.fecha ?? 0).getTime();
                      const fechaB = new Date(b.fechaCarga ?? b.fecha_carga ?? b.fecha ?? 0).getTime();
                      return fechaA - fechaB;
                    })
                    .map((cobro) => {
                      const idCobro = cobro.id_comprobante ?? cobro.idComprobante ?? cobro.id;
                      const fechaCobro = cobro.fechaCarga ?? cobro.fecha_carga ?? cobro.fecha;
                      const montoCobro = cobro.montoPago ?? cobro.monto_pago ?? cobro.monto ?? 0;
                      const tipoPagoCobro = cobro.tipoPago ?? cobro.tipo_pago ?? cobro.metodoPago ?? cobro.metodo_pago ?? 'EFECTIVO';
                      const urlArchivo = cobro.urlArchivoComprobante ?? cobro.url_archivo_comprobante ?? cobro.urlComprobante;

                      const tieneArchivo = !!urlArchivo;
                      const esDigital = String(tipoPagoCobro).toUpperCase() === 'TRANSFERENCIA' || String(tipoPagoCobro).toUpperCase() === 'DIGITAL';

                      return (
                        <tr key={idCobro}>
                          <td className="fw-bold text-success">
                            ${Number(montoCobro).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>{formatearFechaYHora(fechaCobro)}</td>
                          <td>
                            <span 
                              className="d-inline-block px-2 py-1 rounded font-monospace" 
                              style={{ 
                                backgroundColor: esDigital ? '#dcfce7' : '#e2e8f0', 
                                color: esDigital ? '#15803d' : '#1e293b', 
                                border: esDigital ? '1px solid #86efac' : '1px solid #cbd5e1',
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                lineHeight: '1.2',
                                letterSpacing: '0.025em'
                              }}
                            >
                              {tipoPagoCobro}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              {/* Botón Imprimir Ticket de Cobro específico */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                                title="Imprimir Ticket de Cobro"
                                onClick={() => {
                                  if (onVerTicket) {
                                    onVerTicket(pedido, {
                                      id: idCobro,
                                      monto: montoCobro,
                                      metodoPago: tipoPagoCobro,
                                      fecha: fechaCobro
                                    });
                                  }
                                }}
                              >
                                <i className="bi bi-printer"></i> Ticket
                              </button>

                              {esDigital && !tieneArchivo && (
                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center gap-1 btn-outline-purple"
                                  style={{ border: '1px solid #8e45e0', color: '#a855f7' }}
                                  onClick={() => abrirSelectorArchivo(idCobro)}
                                >
                                  <i className="bi bi-file-earmark-arrow-up"></i> Vincular
                                </button>
                              )}

                              {tieneArchivo && (
                                <>
                                  <a
                                    href={`http://localhost:8080${urlArchivo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-info"
                                    title="Ver Comprobante Adjunto"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    title="Eliminar Comprobante"
                                    onClick={() => onEliminarComprobante(idCobro)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">No hay cobros registrados en este pedido.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-0">
            <button 
              type="button" 
              className="btn btn-secondary px-4" 
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};