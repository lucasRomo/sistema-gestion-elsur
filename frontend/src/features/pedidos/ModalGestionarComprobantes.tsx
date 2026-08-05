import React, { useRef, useState } from 'react';

interface ModalGestionarComprobantesProps {
  pedido: any;
  onClose: () => void;
  onVincularComprobante: (idComprobante: number, archivo: File) => Promise<void>;
  onEliminarComprobante: (idComprobante: number) => Promise<void>;
}

const formatearFechaYHora = (fechaStr: string) => {
  if (!fechaStr) return "-";
  const fecha = new Date(fechaStr);
  
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

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content custom-card" 
          style={{ 
            backgroundColor: 'var(--bs-body-bg, #1a1a1c)', 
            border: '2px solid #8e45e0', 
            borderRadius: '12px' 
          }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: '#a855f7', fontFamily: 'monospace' }}>
              Gestionar Comprobantes - Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p className="small mb-4 text-body-secondary" style={{ fontFamily: 'monospace' }}>
              A continuación se listan los cobros realizados para este pedido. Podés vincular comprobantes físicos a cobros de tipo transferencia o eliminar comprobantes existentes.
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
                  {pedido.comprobantes && pedido.comprobantes.length > 0 ? (
                    [...pedido.comprobantes]
                    .sort((a, b) => new Date(a.fechaCarga).getTime() - new Date(b.fechaCarga).getTime())
                    .map((cobro) => {
                      const tieneArchivo = !!cobro.urlArchivoComprobante;
                      const esDigital = cobro.tipoPago === 'TRANSFERENCIA';

                      return (
                        <tr key={cobro.id_comprobante}>
                          <td className="fw-bold text-success">
                            ${cobro.montoPago.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>{formatearFechaYHora(cobro.fechaCarga)}</td>
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
  {cobro.tipoPago}
</span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              {esDigital && !tieneArchivo && (
                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center gap-1 btn-outline-purple"
                                  style={{ border: '1px solid #8e45e0', color: '#a855f7' }}
                                  onClick={() => abrirSelectorArchivo(cobro.id_comprobante)}
                                >
                                  <i className="bi bi-file-earmark-arrow-up"></i> Vincular
                                </button>
                              )}

                              {tieneArchivo && (
                                <>
                                  <a
                                    href={`http://localhost:8080${cobro.urlArchivoComprobante}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-info"
                                    title="Ver Comprobante"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    title="Eliminar Comprobante"
                                    onClick={() => onEliminarComprobante(cobro.id_comprobante)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </>
                              )}

                              {!esDigital && !tieneArchivo && (
                                <span className="text-muted small">-</span>
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