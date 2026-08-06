import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface ModalConsultarArqueoProps {
  isOpen: boolean;
  onClose: () => void;
  datosArqueo: {
    totalEfectivo: number;
    totalTransferencias: number;
    efectivoIngresos: number;
    efectivoEgresos: number;
    transferenciaIngresos: number;
    transferenciaEgresos: number;
    saldoTotal: number;
  } | null;
  montoInicial?: number;
  movimientos: any[];
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

  // El saldo total en físico incluye el monto inicial sumado al flujo neto de efectivo
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
              {/* Bloque Efectivo */}
              <div className="col-md-6">
                <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-success fs-5">💵 Efectivo en Caja</span>
                    <i className="bi bi-cash-stack fs-4 text-success"></i>
                  </div>
                  <hr className="my-2" style={{ color: cardBorder }} />
                  
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Inicio de Caja:</span>
                    <span className="text-info fw-semibold">${montoInicial.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Ingresos Efectivo:</span>
                    <span className="text-success fw-medium">${datosArqueo?.efectivoIngresos?.toLocaleString('es-AR') || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>Egresos Efectivo:</span>
                    <span className="text-danger fw-medium">${datosArqueo?.efectivoEgresos?.toLocaleString('es-AR') || 0}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="fw-bold" style={{ color: textColor }}>Total Esperado Físico:</span>
                    <span className="fw-bold text-success fs-4">${totalEsperadoFisico.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>

              {/* Bloque Transferencia */}
              <div className="col-md-6">
                <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-info fs-5">💳 Transferencias</span>
                    <i className="bi bi-credit-card-2-front fs-4 text-info"></i>
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
                    <span className="fw-bold text-info fs-4">${datosArqueo?.totalTransferencias?.toLocaleString('es-AR') || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- DETALLE DE MOVIMIENTOS SEPARADO Y CON SCROLL --- */}
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
                            <span className={`badge ${m.tipoMovimiento === 'INGRESO' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
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

            {/* Total Consolidado */}
            <div className="p-3 rounded-3 text-center" style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
              <span className="text-uppercase small fw-bold text-muted d-block mb-1">Saldo Total Estimado Hoy</span>
              <h2 className="fw-bold text-primary m-0">${saldoTotalConsolidado.toLocaleString('es-AR')}</h2>
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