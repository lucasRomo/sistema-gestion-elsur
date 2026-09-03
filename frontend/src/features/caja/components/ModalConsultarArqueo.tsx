import React, { useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { cajaService } from '../services/cajaService';
import type { DatosArqueo, MovimientoCaja } from '../types/caja';

interface ModalConsultarArqueoProps {
  isOpen: boolean;
  onClose: () => void;
  datosArqueo: DatosArqueo | null;
  montoInicial?: number;
  movimientos: MovimientoCaja[];
}

export const ModalConsultarArqueo: React.FC<ModalConsultarArqueoProps> = ({ 
  isOpen, 
  onClose, 
  datosArqueo, 
  montoInicial = 0,
  movimientos = [] 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [imagenModalUrl, setImagenModalUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = '#38bdf8'; 
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const cardBorder = isDark ? '#3f3f46' : '#e2e8f0';
  const textMuted = isDark ? '#a1a1aa' : '#475569';
  const consolidatedBg = isDark ? '#18181b' : '#f1f5f9';
  const consolidatedText = isDark ? '#38bdf8' : '#0284c7';

  const totalEsperadoFisico = montoInicial + (datosArqueo?.totalEfectivo || 0);
  const saldoTotalConsolidado = montoInicial + (datosArqueo?.saldoTotal || 0);

  return (
    <>
      <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div 
            className="modal-content shadow-lg p-4" 
            style={{ 
              backgroundColor: modalBg, 
              border: `2px solid ${modalBorder}`, 
              borderRadius: '14px',
              boxShadow: isDark ? '0 0 20px rgba(56, 189, 248, 0.15)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="modal-header border-0 justify-content-between pb-2">
              <h3 className="fw-bold m-0" style={{ color: textColor }}>Arqueo Automático de Turno</h3>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
            </div>

            <div className="modal-body border-0 py-3">
              <p className="text-muted small mb-4">
                Cálculo estimado acumulado de dinero en efectivo físico disponible vs. montos ingresados por transferencia digital.
              </p>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-success fs-5">💵 Efectivo en Caja</span>
                      <i className="bi bi-cash-stack fs-4 text-success"></i>
                    </div>
                    <hr className="my-2" style={{ color: cardBorder }} />
                    
                    <div className="d-flex justify-content-between small mb-1" style={{ color: textMuted }}>
                      <span>Inicio de Caja:</span>
                      <span className="fw-bold text-info fs-6 text-info-custom">${montoInicial.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1" style={{ color: textMuted }}>
                      <span>Ingresos Efectivo:</span>
                      <span className="text-success fw-medium">${datosArqueo?.efectivoIngresos?.toLocaleString('es-AR') || 0}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-2" style={{ color: textMuted }}>
                      <span>Egresos Efectivo:</span>
                      <span className="text-danger fw-medium">${datosArqueo?.efectivoEgresos?.toLocaleString('es-AR') || 0}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="fw-bold" style={{ color: textColor }}>Total Esperado Físico:</span>
                      <span className="fw-bold text-success fs-4">${totalEsperadoFisico.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-info fs-5 text-info-custom">💳 Transferencias</span>
                    </div>
                    <hr className="my-2" style={{ color: cardBorder }} />
                    
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Ingresos MercadoPago / Banco:</span>
                      <span className="text-success fw-medium">${datosArqueo?.transferenciaIngresos?.toLocaleString('es-AR') || 0}</span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-2">
                      <span>Egresos Transferencia:</span>
                      <span className="text-danger fw-medium">${datosArqueo?.transferenciaEgresos?.toLocaleString('es-AR') || 0}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="fw-bold" style={{ color: textColor }}>Total Digital:</span>
                      <span className="fw-bold text-info fs-6 text-info-custom">${datosArqueo?.totalTransferencias?.toLocaleString('es-AR') || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive rounded-3" style={{ maxHeight: '150px', overflowY: 'auto', border: `1px solid ${cardBorder}` }}>
                <table 
                  className="table table-sm table-hover m-0 text-center align-middle"
                  style={{
                    backgroundColor: 'transparent',
                    '--bs-table-bg': 'transparent',
                    '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor,
                    borderColor: cardBorder
                  } as React.CSSProperties}
                >
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: modalBg, zIndex: 1 }}>
                    <tr className="text-muted small" style={{ backgroundColor: modalBg }}>
                      <th style={{ backgroundColor: modalBg, color: textMuted }}>Hora</th>
                      <th style={{ backgroundColor: modalBg, color: textMuted }}>Monto</th>
                      <th style={{ backgroundColor: modalBg, color: textMuted }}>Método</th>
                      <th style={{ backgroundColor: modalBg, color: textMuted }}>Tipo</th>
                      <th className="text-start" style={{ backgroundColor: modalBg, color: textMuted }}>Descripción</th>
                      <th style={{ backgroundColor: modalBg, color: textMuted }}>Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {movimientos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 text-muted" style={{ backgroundColor: 'transparent' }}>
                          No hay movimientos registrados en este turno
                        </td>
                      </tr>
                    ) : (
                      movimientos.map((m: any) => {
                        const rawUrl = m.comprobanteImagen || m.comprobante || m.imagenComprobante;
                        const imagenAdjunta = rawUrl ? cajaService.obtenerUrlComprobante(rawUrl) : null;
                        
                        return (
                          <tr key={m.id_movimiento || m.idMovimiento} style={{ borderColor: cardBorder }}>
                            <td style={{ backgroundColor: 'transparent', color: textColor }}>
                              {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="fw-bold" style={{ backgroundColor: 'transparent', color: textColor }}>
                              ${Number(m.monto).toFixed(2)}
                            </td>
                            <td style={{ backgroundColor: 'transparent' }}>
                              <span className="badge bg-secondary">
                                {m.metodoPago || 'Efectivo'}
                              </span>
                            </td>
                            <td style={{ backgroundColor: 'transparent' }}>
                              <span 
                                className="d-inline-block px-2 py-1 rounded fw-semibold"
                                style={{
                                  backgroundColor: m.tipoMovimiento === 'INGRESO' 
                                    ? '#1c9b4a' 
                                    : '#ef4444',
                                  color: '#ffffff',
                                  border: `1px solid ${m.tipoMovimiento === 'INGRESO' ? '#1c9b4a' : '#ef4444'}`,
                                  fontSize: '0.60rem'
                                }}
                              >
                                {m.tipoMovimiento === 'INGRESO' ? 'Ganancia' : 'Egreso'}
                              </span>
                            </td>
                            <td className="text-start text-truncate" style={{ maxWidth: '180px', backgroundColor: 'transparent', color: textColor }}>
                              {m.descripcion || '-'}
                            </td>
                            <td style={{ backgroundColor: 'transparent' }}>
                              {imagenAdjunta ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-info p-0 px-2 text-info-custom"
                                  title="Ver Comprobante Adjunto"
                                  onClick={() => setImagenModalUrl(imagenAdjunta)}
                                >
                                  <i className="bi bi-file-image"></i>
                                </button>
                              ) : (
                                <span className="text-muted opacity-50">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-3 text-center mt-4" style={{ backgroundColor: consolidatedBg, border: `1px solid ${cardBorder}` }}>
                <span className="text-uppercase small fw-bold d-block mb-1" style={{ color: textMuted }}>
                  Saldo Total Estimado Hoy
                </span>
                <h2 className="fw-bold m-0" style={{ color: consolidatedText }}>
                  ${saldoTotalConsolidado.toLocaleString('es-AR')}
                </h2>
              </div>
            </div>

            <div className="modal-footer border-0 justify-content-end pt-2">
              <button className="btn btn-secondary px-4 fw-bold" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {imagenModalUrl && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className={`modal-content p-3 ${textColor}`} style={{ backgroundColor: modalBg, border: `2px solid ${modalBorder}` }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setImagenModalUrl(null)}></button>
              </div>
              <div className="text-center p-2">
                <img src={imagenModalUrl} alt="Comprobante Transferencia" className="img-fluid rounded shadow" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
              </div>
              <div className="text-end mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setImagenModalUrl(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};