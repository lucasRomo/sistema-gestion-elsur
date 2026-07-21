import React, { useRef, useState } from 'react';

interface Pago {
  id_comprobante: number;
  montoPago: number;
  tipoPago: string;
  fechaCarga: string;
  urlArchivoComprobante: string | null;
}

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
        
        {/* ➔ CAMBIADO: Fondo negro puro (#0b0b0c) y borde verde esmeralda brillante (#22c55e) de 2px */}
        <div 
          className="modal-content text-white" 
          style={{ 
            backgroundColor: '#0b0b0c', 
            border: '2px solid #500b91', 
            borderRadius: '12px' 
          }}
        >
          
          <div className="modal-header border-0 pb-0">
            {/* ➔ CAMBIADO: Título en color verde esmeralda brillante */}
            <h5 className="modal-title fw-bold" style={{ color: '#500b91', fontFamily: 'monospace' }}>
              Gestionar Comprobantes - Pedido #{pedido.id_pedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p className="small mb-4" style={{ fontFamily: 'monospace' }}>
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
              {/* ➔ CAMBIADO: Tabla con bordes finos oscuros */}
              <table className="table table-dark table-hover align-middle mb-0" style={{ borderColor: '#1e1e24' }}>
                <thead>
                  <tr style={{ color: '#a1a1aa', fontFamily: 'monospace' }}>
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
                        <tr key={cobro.id_comprobante} style={{ borderBottom: '1px solid #1e1e24' }}>
                          
                          {/* ➔ CAMBIADO: Monto en color verde esmeralda brillante */}
                          <td className="fw-bold" style={{ color: '#22c55e' }}>
                            ${cobro.montoPago.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          
                          <td style={{ color: '#e4e4e7' }}>{formatearFechaYHora(cobro.fechaCarga)}</td>
                          
                          <td>
                            {/* ➔ CAMBIADO: Badge de transferencia usa el color verde de fondo con bordes limpios */}
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: esDigital ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                color: esDigital ? '#22c55e' : '#a1a1aa',
                                border: esDigital ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)'
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
                                  className="btn btn-sm d-flex align-items-center gap-1 text-white"
                                  style={{ backgroundColor: 'transparent', border: '1px solid #500b91', borderRadius: '6px' }}
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
            {/* ➔ CAMBIADO: Botón cerrar usando un estilo gris oscuro discreto con bordes curvos */}
            <button 
              type="button" 
              className="btn text-white px-4" 
              style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', fontFamily: 'monospace' }}
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