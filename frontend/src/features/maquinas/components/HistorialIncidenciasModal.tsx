import React, { useEffect, useState } from 'react';
import type { Maquina } from '../types/Maquina';
import type { Incidencia, Empleado } from '../types/Incidencia';
import { useTheme } from '../../../Context/ThemeContext';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { incidenciaService } from '../service/incidenciaService';

interface Props {
  show: boolean;
  maquina: Maquina | null;
  onClose: () => void;
  onIncidenciaResuelta: () => void;
  onPagoExitoso?: (mensaje: string) => void;
}

export const HistorialIncidenciasModal: React.FC<Props> = ({ 
  show, 
  maquina: maquinaProp, 
  onClose, 
  onIncidenciaResuelta,
  onPagoExitoso 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const cardSectionBg = isDark ? '#27272a' : '#f1f5f9';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  const [maquina, setMaquina] = useState<Maquina | null>(maquinaProp);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(false);

  // Formularios en línea
  const [idAccionActiva, setIdAccionActiva] = useState<number | null>(null);
  const [tipoAccion, setTipoAccion] = useState<'MANTENIMIENTO' | 'RESOLVER' | null>(null);
  const [textoNota, setTextoNota] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  // Pago de Arreglo
  const [incidenciaAPagar, setIncidenciaAPagar] = useState<Incidencia | null>(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [conceptoPago, setConceptoPago] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  // Ticket impresió/visualización
  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  // Advertencia saldo insuficiente
  const [showModalSaldoInsuficiente, setShowModalSaldoInsuficiente] = useState(false);
  const [mensajeErrorSaldo, setMensajeErrorSaldo] = useState('');

  useEffect(() => {
    setMaquina(maquinaProp);
  }, [maquinaProp]);

  const cargarHistorial = async () => {
    if (!maquina?.idMaquina) return;
    setCargando(true);
    try {
      const data = await incidenciaService.getByMaquinaId(maquina.idMaquina);
      setIncidencias(data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (show && maquina) {
      cargarHistorial();
      limpiarFormulario();
    }
  }, [show, maquina?.idMaquina]);

  if (!show || !maquina) return null;

  const getUsuarioActualId = () => {
    const usrStr = localStorage.getItem('usuario_logueado');
    if (usrStr) {
      try {
        const obj = JSON.parse(usrStr);
        return obj.idEmpleado || obj.idUsuario || obj.id_usuario || 1;
      } catch (e) {
        return 1;
      }
    }
    return 1;
  };

  const formatEmpleado = (empleado?: Empleado, defaultTexto: string = 'Sin asignar') => {
    if (!empleado) return defaultTexto;
    if (empleado.persona && (empleado.persona.nombre || empleado.persona.apellido)) {
      return `${empleado.persona.nombre || ''} ${empleado.persona.apellido || ''}`.trim();
    }
    if (empleado.idEmpleado) {
      return `Empleado #${empleado.idEmpleado}`;
    }
    return defaultTexto;
  };

  const handlePonerEnMantenimiento = async (idIncidencia: number) => {
    if (!textoNota.trim()) {
      setErrorValidacion('Ingrese la nota de mantenimiento.');
      return;
    }

    try {
      await incidenciaService.ponerEnMantenimiento(
        idIncidencia, 
        textoNota.trim(), 
        getUsuarioActualId()
      );

      setMaquina({ ...maquina, estado: 'MANTENIMIENTO' });
      limpiarFormulario();
      cargarHistorial();
      onIncidenciaResuelta();
    } catch (err) {
      console.error("Error al pasar a mantenimiento:", err);
    }
  };

  const handleResolver = async (idIncidencia: number) => {
    if (!textoNota.trim()) {
      setErrorValidacion('Ingrese el detalle de la solución.');
      return;
    }

    try {
      await incidenciaService.resolver(
        idIncidencia, 
        textoNota.trim(), 
        getUsuarioActualId()
      );

      setMaquina({ ...maquina, estado: 'OPERATIVA' });
      limpiarFormulario();
      cargarHistorial();
      onIncidenciaResuelta();
    } catch (err) {
      console.error("Error al resolver la incidencia:", err);
    }
  };

  const ejecutarPagoMantenimiento = async (forzar: boolean = false) => {
    if (!incidenciaAPagar?.idIncidencia) return;
    
    if (!montoPago || Number(montoPago) <= 0) {
      setErrorPago("Ingrese un monto válido mayor a 0.");
      return;
    }

    setErrorPago(null);
    setProcesandoPago(true);

    try {
      const { ok, data } = await incidenciaService.registrarPagoMantenimiento(
        incidenciaAPagar.idIncidencia,
        {
          monto: Number(montoPago),
          metodoPago,
          descripcion: conceptoPago.trim() || `Pago reparación ${maquina.nombre}`,
          idUsuario: getUsuarioActualId(),
          forzarSaldoInsuficiente: forzar
        }
      );

      if (ok) {
        const idMov = data?.idMovimiento || data?.id_movimiento || data?.id || '-';
        const conceptoFinal = conceptoPago.trim() || `Pago servicio técnico ${maquina.nombre} - Incidencia #${incidenciaAPagar.idIncidencia}`;

        // Desplegar ticket de pago de egreso listo para imprimir
        setTicketSeleccionado({
          pedido: {
            id_pedido: '-',
            cliente: {
              persona: null,
              razon_social: 'Servicio Técnico / Mantenimiento',
              nombre: 'Servicio Técnico / Mantenimiento'
            },
            monto_total: Number(montoPago),
            observaciones: conceptoFinal
          },
          movimiento: {
            id_movimiento: idMov,
            monto: Number(montoPago),
            tipoMovimiento: 'EGRESO',
            categoria: 'EGRESO_MANTENIMIENTO',
            descripcion: conceptoFinal,
            fecha: new Date().toISOString(),
            metodoPago
          }
        });

        setIncidenciaAPagar(null);
        setShowModalSaldoInsuficiente(false);
        setMontoPago('');
        setConceptoPago('');
        cargarHistorial();
      } else {
        if (data.code === 'CAJA_CERRADA') {
          setErrorPago("Error: La caja se encuentra CERRADA. Inicie el turno de caja antes de realizar pagos.");
        } else if (data.code === 'SALDO_INSUFFICIENT') {
          setMensajeErrorSaldo(data.message || 'El saldo en caja es menor al monto ingresado.');
          setShowModalSaldoInsuficiente(true);
        } else {
          setErrorPago(data.message || "Error al procesar el pago.");
        }
      }
    } catch (err) {
      setErrorPago("Error de conexión al registrar pago con el servidor.");
    } finally {
      setProcesandoPago(false);
    }
  };

  const limpiarFormulario = () => {
    setIdAccionActiva(null);
    setTipoAccion(null);
    setTextoNota('');
    setErrorValidacion('');
  };

  const renderBadgeEstado = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'OPERATIVA':
        return <span className="badge bg-success text-white fw-bold"><i className="bi bi-check-circle me-1"></i>OPERATIVA</span>;
      case 'FUERA DE SERVICIO':
      case 'FALLA':
        return <span className="badge bg-danger text-white fw-bold"><i className="bi bi-exclamation-octagon me-1"></i>FUERA DE SERVICIO</span>;
      case 'MANTENIMIENTO':
        return <span className="badge bg-warning text-dark fw-bold"><i className="bi bi-tools me-1"></i>MANTENIMIENTO</span>;
      default:
        return <span className="badge bg-secondary text-white">{estado}</span>;
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ backgroundColor: modalBg, color: textColor, borderRadius: '12px', border: `1px solid ${modalBorder}` }}>
          
          {/* Header */}
          <div className="modal-header d-flex justify-content-between align-items-center" style={{ borderBottom: `2px solid ${modalBorder}`, padding: '16px 24px' }}>
            <div className="d-flex align-items-center gap-3">
              <h5 className="modal-title font-monospace fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: textColor }}>
                <i className="bi bi-clock-history text-info"></i>
                Historial de Incidencias: <span className="text-warning">{maquina.nombre}</span>
              </h5>
              {renderBadgeEstado(maquina.estado)}
            </div>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {cargando ? (
              <div className="text-center py-5 font-monospace" style={{ color: textSubtle }}>
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando historial de incidencias...
              </div>
            ) : incidencias.length === 0 ? (
              <div className="text-center py-5 font-monospace" style={{ backgroundColor: cardSectionBg, borderRadius: '8px', border: `1px solid ${modalBorder}`, color: textSubtle }}>
                <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                Sin registros técnicos para este equipo.
              </div>
            ) : (
              <div className="d-flex flex-column gap-4 font-monospace">
                {incidencias.map((inc) => {
                  const esResuelta = inc.estadoIncidencia === 'RESUELTA';
                  const tieneMantenimiento = Boolean(inc.notaMantenimiento);
                  const esMantenimientoActivo = !esResuelta && (maquina.estado === 'MANTENIMIENTO' || tieneMantenimiento);
                  const esPagado = Boolean(inc.pagado);

                  return (
                    <div 
                      key={inc.idIncidencia} 
                      className="p-3 rounded-3 shadow" 
                      style={{ backgroundColor: cardBg, border: `1px solid ${modalBorder}` }}
                    >
                      {/* Cabecera Tarjeta */}
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: modalBorder }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold font-monospace" style={{ color: textSubtle }}>Incidencia #{inc.idIncidencia}</span>
                          <span className={`badge ${
                            inc.prioridad === 'CRITICA' || inc.prioridad === 'ALTA' ? 'bg-danger' :
                            inc.prioridad === 'MEDIA' ? 'bg-warning text-dark' : 'bg-info text-dark'
                          }`}>
                            PRIORIDAD {inc.prioridad || 'MEDIA'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          
                          {esPagado ? (
                            <div className="d-flex align-items-center gap-1">
                              <span 
                                className="bg-success text-white font-semibold px-2 py-1 rounded flex items-center gap-1 fw-bold"
                                style={{ fontSize: '0.78rem' }}
                              >
                                <i className="bi bi-check-circle-fill me-1"></i> Pago hecho
                              </span>
                              <button
                                className="btn btn-xs btn-outline-info fw-bold py-0 px-2"
                                style={{ fontSize: '0.78rem' }}
                                title="Ver / Imprimir Ticket"
                                onClick={() => {
                                  const conceptoFinal = (inc as any).conceptoPago || `Pago reparación ${maquina.nombre} - Incidencia #${inc.idIncidencia}`;
                                  setTicketSeleccionado({
                                    pedido: {
                                      id_pedido: '-',
                                      cliente: { persona: null, razon_social: 'Servicio Técnico / Mantenimiento', nombre: 'Servicio Técnico / Mantenimiento' },
                                      monto_total: (inc as any).montoPago || (inc as any).monto || 0,
                                      observaciones: conceptoFinal
                                    },
                                    movimiento: {
                                      id_movimiento: (inc as any).idMovimiento || '-',
                                      monto: (inc as any).montoPago || (inc as any).monto || 0,
                                      tipoMovimiento: 'EGRESO',
                                      categoria: 'EGRESO_MANTENIMIENTO',
                                      descripcion: conceptoFinal,
                                      fecha: (inc as any).fechaPago || new Date().toISOString(),
                                      metodoPago: (inc as any).metodoPago || 'EFECTIVO'
                                    }
                                  });
                                }}
                              >
                                <i className="bi bi-receipt"></i>
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-xs btn-outline-danger fw-bold py-0 px-2"
                              style={{ fontSize: '0.78rem' }}
                              onClick={() => {
                                setIncidenciaAPagar(inc);
                                setMontoPago('');
                                setConceptoPago(`Pago mantenimiento ${maquina.nombre} - Incidencia #${inc.idIncidencia}`);
                              }}
                            >
                              <i className="bi bi-cash-coin me-1"></i> Pagar Arreglo
                            </button>
                          )}

                          <span className={`badge px-2 py-1 fw-bold ${
                            esResuelta ? 'bg-success' : esMantenimientoActivo ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {esResuelta ? 'RESUELTO' : esMantenimientoActivo ? 'EN MANTENIMIENTO' : 'PENDIENTE'}
                          </span>
                        </div>
                      </div>

                      {/* TRES COLUMNAS PARA CADA ETAPA */}
                      <div className="row g-2 align-items-stretch">
                        
                        {/* ETAPA 1: REPORTADO / FALLA */}
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ 
                            backgroundColor: cardSectionBg, 
                            borderLeft: '4px solid #dc3545'
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="badge bg-danger d-flex align-items-center gap-1">
                                  <i className="bi bi-exclamation-octagon-fill"></i> 1. REPORTADO
                                </span>
                                <small style={{ color: textSubtle, fontSize: '0.72rem' }}>
                                  {inc.fechaReporte ? new Date(inc.fechaReporte).toLocaleString() : '-'}
                                </small>
                              </div>
                              <p className="mb-2 fw-medium" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: textColor }}>
                                {inc.descripcion}
                              </p>
                            </div>
                            <div className="small pt-2 border-top mt-2" style={{ borderColor: modalBorder, fontSize: '0.75rem', color: textSubtle }}>
                              <i className="bi bi-person-fill text-warning me-1"></i>
                              Reportó: <strong style={{ color: textColor }}>{formatEmpleado(inc.empleadoReporta, 'Sistema')}</strong>
                            </div>
                          </div>
                        </div>

                        {/* ETAPA 2: NOTA DE MANTENIMIENTO */}
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ 
                            backgroundColor: cardSectionBg, 
                            borderLeft: `4px solid ${tieneMantenimiento || esMantenimientoActivo ? '#ffc107' : '#6c757d'}`
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`badge ${tieneMantenimiento || esMantenimientoActivo ? 'bg-warning text-dark' : 'bg-secondary'} d-flex align-items-center gap-1`}>
                                  <i className="bi bi-tools"></i> 2. MANTENIMIENTO
                                </span>
                                <small style={{ color: textSubtle, fontSize: '0.72rem' }}>
                                  {inc.fechaMantenimiento ? new Date(inc.fechaMantenimiento).toLocaleString() : (esResuelta ? 'COMPLETADO' : 'PENDIENTE')}
                                </small>
                              </div>

                              {idAccionActiva === inc.idIncidencia && tipoAccion === 'MANTENIMIENTO' ? (
                                <div className="mt-1">
                                  <textarea
                                    className="form-control form-control-sm mb-2"
                                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                                    rows={2}
                                    value={textoNota}
                                    onChange={(e) => {
                                      setTextoNota(e.target.value);
                                      if (errorValidacion) setErrorValidacion('');
                                    }}
                                    placeholder="Detalle técnico de mantenimiento..."
                                  />
                                  {errorValidacion && <small className="text-danger d-block mb-1">{errorValidacion}</small>}
                                  <div className="d-flex gap-1 justify-content-end">
                                    <button className={`btn btn-xs ${isDark ? 'btn-secondary' : 'btn-secondary'} py-0 px-2`} onClick={limpiarFormulario}>Cancelar</button>
                                    <button className="btn btn-xs btn-warning fw-bold py-0 px-2" onClick={() => handlePonerEnMantenimiento(inc.idIncidencia!)}>Guardar</button>
                                  </div>
                                </div>
                              ) : inc.notaMantenimiento ? (
                                <p className="mb-2 text-warning fw-medium" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                  {inc.notaMantenimiento}
                                </p>
                              ) : maquina.estado === 'OPERATIVA' ? (
                                <div className="text-center py-2">
                                  <span className="badge bg-secondary p-2 d-block" style={{ color: textSubtle }}>
                                    <i className="bi bi-info-circle me-1"></i> Se pasó a operativo. No requiere mantenimiento.
                                  </span>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <button
                                    className="btn btn-warning text-dark fw-bold btn-sm px-3 py-1 shadow"
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => {
                                      setIdAccionActiva(inc.idIncidencia!);
                                      setTipoAccion('MANTENIMIENTO');
                                      setTextoNota('');
                                      setErrorValidacion('');
                                    }}
                                  >
                                    <i className="bi bi-tools me-1"></i> Pasar a Mantenimiento
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="small pt-2 border-top mt-2" style={{ borderColor: modalBorder, fontSize: '0.75rem', color: textSubtle }}>
                              <i className="bi bi-gear-fill text-info me-1"></i>
                              Técnico: <strong style={{ color: textColor }}>{formatEmpleado(inc.empleadoMantenimiento, 'En taller')}</strong>
                            </div>
                          </div>
                        </div>

                        {/* ETAPA 3: RESOLUCIÓN / ALTA */}
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ 
                            backgroundColor: cardSectionBg, 
                            borderLeft: `4px solid ${esResuelta ? '#20c997' : '#6c757d'}`
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`badge ${esResuelta ? 'bg-success' : 'bg-secondary'} d-flex align-items-center gap-1`}>
                                  <i className="bi bi-check-circle-fill"></i> 3. ALTA OPERATIVA
                                </span>
                                {esResuelta && (
                                  <small style={{ color: textSubtle, fontSize: '0.72rem' }}>
                                    {inc.fechaResolucion ? new Date(inc.fechaResolucion).toLocaleString() : '-'}
                                  </small>
                                )}
                              </div>

                              {idAccionActiva === inc.idIncidencia && tipoAccion === 'RESOLVER' ? (
                                <div className="mt-1">
                                  <textarea
                                    className="form-control form-control-sm mb-2"
                                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                                    rows={2}
                                    value={textoNota}
                                    onChange={(e) => {
                                      setTextoNota(e.target.value);
                                      if (errorValidacion) setErrorValidacion('');
                                    }}
                                    placeholder="Solución final para dar el alta..."
                                  />
                                  {errorValidacion && <small className="text-danger d-block mb-1">{errorValidacion}</small>}
                                  <div className="d-flex gap-1 justify-content-end">
                                    <button className={`btn btn-xs ${isDark ? 'btn-outline-light' : 'btn-outline-secondary'} py-0 px-2`} onClick={limpiarFormulario}>Cancelar</button>
                                    <button className="btn btn-xs btn-success fw-bold py-0 px-2" onClick={() => handleResolver(inc.idIncidencia!)}>Dar Alta</button>
                                  </div>
                                </div>
                              ) : esResuelta ? (
                                <p className="mb-2 text-info fw-semibold" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                  {inc.resolucion}
                                </p>
                              ) : (
                                <div className="text-center py-2">
                                  <button
                                    className="btn btn-success btn-sm fw-bold px-2 py-1 shadow"
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => {
                                      setIdAccionActiva(inc.idIncidencia!);
                                      setTipoAccion('RESOLVER');
                                      setTextoNota('');
                                      setErrorValidacion('');
                                    }}
                                  >
                                    <i className="bi bi-check2-circle me-1"></i> Resolver / Operativa
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="small pt-2 border-top mt-2" style={{ borderColor: modalBorder, fontSize: '0.75rem', color: textSubtle }}>
                              <i className="bi bi-wrench-adjustable text-success me-1"></i>
                              Resuelto por: <strong style={{ color: textColor }}>{formatEmpleado(inc.empleadoResuelve, 'Pendiente')}</strong>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}`, padding: '12px 24px' }}>
            <button type="button" className={`btn ${isDark ? 'btn-secondary' : 'btn-secondary'} font-monospace`} onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>

      {/* --- MODAL REGISTRO DE PAGO --- */}
      {incidenciaAPagar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content font-monospace" style={{ backgroundColor: modalBg, color: textColor, border: '1px solid #dc3545', borderRadius: '12px' }}>
              <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-cash-stack me-2"></i>Registrar Egreso por Mantenimiento
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setIncidenciaAPagar(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small mb-3" style={{ color: textSubtle }}>
                  Este egreso quedará categorizado como <strong className="text-warning">"EGRESO_MANTENIMIENTO"</strong> e impactará directamente sobre el saldo del turno de caja activo.
                </p>

                {errorPago && (
                  <div className="alert alert-danger font-monospace py-2 px-3 small mb-3 border-0 rounded-3 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    <span>{errorPago}</span>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">Monto pagado ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control fs-5"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={montoPago}
                    onChange={(e) => {
                      setMontoPago(e.target.value);
                      if (errorPago) setErrorPago(null);
                    }}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Medio de Pago:</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="EFECTIVO">Efectivo (Impacta saldo físico)</option>
                    <option value="TRANSFERENCIA">Transferencia / Banco</option>
                    <option value="DEBITO">Débito</option>
                    <option value="CREDITO">Crédito</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Concepto / Detalle:</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={conceptoPago}
                    onChange={(e) => setConceptoPago(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button type="button" className={`btn ${isDark ? 'btn-secondary' : 'btn-secondary'}`} onClick={() => setIncidenciaAPagar(null)} disabled={procesandoPago}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger fw-bold px-4" onClick={() => ejecutarPagoMantenimiento(false)} disabled={procesandoPago}>
                  {procesandoPago ? 'Procesando...' : 'Confirmar Egreso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN: SALDO INSUFICIENTE --- */}
      {showModalSaldoInsuficiente && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1200 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content font-monospace" style={{ backgroundColor: modalBg, color: textColor, border: '1px solid #ffc107', borderRadius: '12px' }}>
              <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
                <h5 className="modal-title fw-bold text-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Saldo en Caja Insuficiente
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setShowModalSaldoInsuficiente(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p style={{ color: textColor }}>{mensajeErrorSaldo}</p>
                <p className="small m-0" style={{ color: textSubtle }}>
                  ¿Desea autorizar y registrar este egreso de todos modos dejando la caja en negativo?
                </p>
              </div>
              <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button type="button" className="btn btn-danger px-3" onClick={() => setShowModalSaldoInsuficiente(false)} disabled={procesandoPago}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-warning fw-bold text-white px-4" style={{ color: '#ffffff' }} onClick={() => ejecutarPagoMantenimiento(true)} disabled={procesandoPago}>
                  {procesandoPago ? 'Procesando...' : 'Aceptar igual'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TICKET DE IMPRESIÓN PAGO TÉCNICO --- */}
      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={true}
        />
      )}

    </div>
  );
};