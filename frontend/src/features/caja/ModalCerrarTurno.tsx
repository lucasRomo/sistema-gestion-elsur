import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';
import { SuccesModal } from '../../components/layouts/SuccesModal';

interface ModalCerrarTurnoProps {
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
  montoInicialTurno: number;
  onConfirmarCierre: (montoRealEfectivo: number, observaciones?: string) => Promise<boolean | void>;
  guardando: boolean;
  movimientos: any[];
}

export const ModalCerrarTurno: React.FC<ModalCerrarTurnoProps> = ({
  isOpen,
  onClose,
  datosArqueo,
  montoInicialTurno,
  onConfirmarCierre,
  guardando,
  movimientos = [] 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [efectivoContado, setEfectivoContado] = useState<string>('0');
  const [pasoJustificacion, setPasoJustificacion] = useState<boolean>(false);
  const [observacion, setObservacion] = useState<string>('');
  
  // Estado para controlar la visibilidad y datos del SuccesModal
  const [showExitoModal, setShowExitoModal] = useState<boolean>(false);
  const [diferenciaFinal, setDiferenciaFinal] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setEfectivoContado('0');
      setPasoJustificacion(false);
      setObservacion('');
      setShowExitoModal(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const efectivoEsperado = montoInicialTurno + (datosArqueo?.totalEfectivo || 0);
  const valorContado = Number(efectivoContado) || 0;
  const diferenciaEfectivo = valorContado - efectivoEsperado;
  const hayDiferencia = Math.abs(diferenciaEfectivo) > 0.01;

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const cardBg = isDark ? '#27272a' : '#f8fafc';
  const cardBorder = isDark ? '#3f3f46' : '#e2e8f0';

  const ejecutarCierre = async () => {
    try {
      await onConfirmarCierre(valorContado, observacion);
      setDiferenciaFinal(diferenciaEfectivo);
      setShowExitoModal(true);
    } catch (error) {
      console.error("Error al cerrar el turno:", error);
    }
  };

  const handleValidarYSiguiente = (e: React.FormEvent) => {
    e.preventDefault();
    if (hayDiferencia && !pasoJustificacion) {
      setPasoJustificacion(true);
    } else {
      ejecutarCierre();
    }
  };

  const handleCerrarExito = () => {
    setShowExitoModal(false);
    onClose();
  };

  if (showExitoModal) {
    const resumenDiferencia = diferenciaFinal === 0 
      ? 'Caja Balanceada Registrada Correctamente sin Diferencias'
      : `Se ha Registrado el Monto Junto a Razon de Diferencia Correctamente, Total Ingresado: $${Math.abs(diferenciaFinal).toLocaleString('es-AR')} (${diferenciaFinal < 0 ? 'Faltan Ingresos' : 'Sobran Ingresos'})`;

    return (
      <SuccesModal
        show={showExitoModal}
        title="Turno cerrado con éxito."
        message={resumenDiferencia}
        icon="bi-check-lg"
        onClose={handleCerrarExito}
      />
    );
  }

  return (
    <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg p-4" style={{ backgroundColor: modalBg, borderColor: modalBorder, borderRadius: '14px', border: `1px solid ${modalBorder}` }}>
          
          <div className="modal-header border-0 justify-content-between pb-2">
            <h3 className="fw-bold m-0" style={{ color: textColor }}>
              {pasoJustificacion ? '⚠️ Justificación de Diferencia' : 'Cerrar Turno y Arqueo'}
            </h3>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose} disabled={guardando}></button>
          </div>

          <div className="modal-body border-0 py-2">
            {!pasoJustificacion ? (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                      <span className="fw-bold text-success fs-6 d-block mb-1">💵 Efectivo en Sistema</span>
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Fondo Inicial:</span>
                        <span>${montoInicialTurno.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Flujo Efectivo:</span>
                        <span>${(datosArqueo?.totalEfectivo || 0).toLocaleString('es-AR')}</span>
                      </div>
                      <hr className="my-2" style={{ color: cardBorder }} />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold small" style={{ color: textColor }}>Esperado en Cajón:</span>
                        <span className="fw-bold text-success fs-5">${efectivoEsperado.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                      <span className="fw-bold text-info fs-6 d-block mb-1">💳 Transferencias Digitales</span>
                      <div className="d-flex justify-content-between small text-muted mt-3">
                        <span>Total Digital Acumulado:</span>
                        <span className="fw-bold text-info fs-5">${(datosArqueo?.totalTransferencias || 0).toLocaleString('es-AR')}</span>
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

                <form id="form-cierre" onSubmit={handleValidarYSiguiente}>
                  <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: isDark ? '#222122' : '#f1f5f9', border: `1px solid ${cardBorder}` }}>
                    <label htmlFor="efectivoReal" className="form-label small text-uppercase fw-bold text-warning d-block text-center">
                      Ingresá el efectivo contado en la caja física ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="efectivoReal"
                      className="form-control form-control-lg bg-dark text-white border-warning font-monospace text-center fs-2 fw-bold"
                      value={efectivoContado}
                      onChange={(e) => setEfectivoContado(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </form>
              </>
            ) : (
              <div className="py-2">
                <div className="alert alert-warning border-warning d-flex align-items-center gap-3 p-3 mb-4">
                  <i className="bi bi-exclamation-triangle-fill fs-1 text-warning"></i>
                  <div>
                    <h5 className="fw-bold m-0 text-dark">¡Los números no coinciden!</h5>
                    <p className="m-0 small text-dark">
                      Esperado en caja: <strong>${efectivoEsperado.toLocaleString('es-AR')}</strong> | Contado: <strong>${valorContado.toLocaleString('es-AR')}</strong>
                    </p>
                    <span className={`fw-bold ${diferenciaEfectivo < 0 ? 'text-danger' : 'text-success'}`}>
                      Diferencia: {diferenciaEfectivo < 0 ? `Faltante de $${Math.abs(diferenciaEfectivo)}` : `Sobrante de $${diferenciaEfectivo}`}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="observaciones" className="form-label fw-bold" style={{ color: textColor }}>
                    Ingresá la razón / observación de la diferencia (Obligatorio):
                  </label>
                  <textarea
                    id="observaciones"
                    className="form-control bg-dark text-white border-secondary"
                    rows={4}
                    placeholder="Ej: Se entregó vuelto de más por falta de cambio / Error en cobro..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-0 justify-content-between pt-3">
            {pasoJustificacion ? (
              <>
                <button type="button" className="btn btn-outline-light px-4" onClick={() => setPasoJustificacion(false)} disabled={guardando}>
                  ⬅️ Volver a corregir monto
                </button>
                <button
                  type="button"
                  className="btn btn-warning px-4 fw-bold text-dark"
                  onClick={ejecutarCierre}
                  disabled={guardando || !observacion.trim()}
                >
                  {guardando ? 'Guardando...' : 'Confirmar y Cerrar Turno'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" form="form-cierre" className="btn btn-warning px-4 fw-bold text-dark" disabled={guardando}>
                  {hayDiferencia ? 'Revisar Diferencia' : 'Confirmar Cierre'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};