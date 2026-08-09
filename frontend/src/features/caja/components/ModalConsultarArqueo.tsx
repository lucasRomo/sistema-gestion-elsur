import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';
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

  if (!isOpen) return null;

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const cardBg = isDark ? '#27272a' : '#f8fafc';
  const cardBorder = isDark ? '#3f3f46' : '#e2e8f0';
  const textMuted = isDark ? '#a1a1aa' : '#475569';
  const consolidatedBg = isDark ? '#1e293b' : '#f1f5f9';
  const consolidatedText = isDark ? '#38bdf8' : '#0284c7';

  const totalEsperadoFisico = montoInicial + (datosArqueo?.totalEfectivo || 0);
  const saldoTotalConsolidado = montoInicial + (datosArqueo?.saldoTotal || 0);

  return (
    <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg p-4" style={{ backgroundColor: modalBg, borderColor: modalBorder, borderRadius: '14px', border: `1px solid ${modalBorder}` }}>
          
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
                    <span className="fw-bold text-info fs-6">${montoInicial.toLocaleString('es-AR')}</span>
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
                    <span className="fw-bold text-info fs-5">💳 Transferencias</span>
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
                    <span className="fw-bold text-info fs-6">${datosArqueo?.totalTransferencias?.toLocaleString('es-AR') || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-2" style={{ color: textColor }}>Detalle de Movimientos del Turno</h6>
              <div className="table-responsive rounded-3" style={{ maxHeight: '150px', overflowY: 'auto', border: `1px solid ${cardBorder}` }}>
                <table className={`table table-sm table-hover m-0 text-center align-middle ${isDark ? 'table-dark' : ''}`}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: cardBg, zIndex: 1 }}>
                    <tr className="text-muted small">
                      <th>Hora</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Tipo</th>
                      <th className="text-start">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {movimientos.length === 0 ? (
                      <tr><td colSpan={5} className="py-3 text-muted">No hay movimientos registrados en este turno</td></tr>
                    ) : (
                      movimientos.map((m) => (
                        <tr key={m.id_movimiento || m.idMovimiento}>
                          <td>{new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="fw-bold">${Number(m.monto).toFixed(2)}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {m.metodoPago || 'Efectivo'}
                            </span>
                          </td>
                          <td>
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
                          <td className="text-start text-truncate" style={{ maxWidth: '200px' }}>
                            {m.descripcion || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 rounded-3 text-center" style={{ backgroundColor: consolidatedBg, border: `1px solid ${cardBorder}` }}>
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
  );
};