import React, { useEffect, useState } from 'react';
import type { Maquina } from '../../types/Maquina';
import type { Incidencia, Empleado } from '../../types/Incidencia';

interface Props {
  show: boolean;
  maquina: Maquina | null;
  onClose: () => void;
  onIncidenciaResuelta: () => void;
}

export const HistorialIncidenciasModal: React.FC<Props> = ({ show, maquina: maquinaProp, onClose, onIncidenciaResuelta }) => {
  const [maquina, setMaquina] = useState<Maquina | null>(maquinaProp);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estado local para los IDs de incidencias cuyos pagos se realizaron en la sesión actual
  const [incidenciasPagadas, setIncidenciasPagadas] = useState<number[]>([]);

  // Formularios en línea para cambios de estado
  const [idAccionActiva, setIdAccionActiva] = useState<number | null>(null);
  const [tipoAccion, setTipoAccion] = useState<'MANTENIMIENTO' | 'RESOLVER' | null>(null);
  const [textoNota, setTextoNota] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  // Modal para Registro de Pago de Arreglo
  const [incidenciaAPagar, setIncidenciaAPagar] = useState<Incidencia | null>(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [conceptoPago, setConceptoPago] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  // Modal de advertencia por saldo insuficiente
  const [showModalSaldoInsuficiente, setShowModalSaldoInsuficiente] = useState(false);
  const [mensajeErrorSaldo, setMensajeErrorSaldo] = useState('');

  useEffect(() => {
    setMaquina(maquinaProp);
  }, [maquinaProp]);

  const cargarHistorial = async () => {
    if (!maquina?.idMaquina) return;
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:8080/api/incidencias/maquina/${maquina.idMaquina}`);
      if (res.ok) {
        const data = await res.json();
        setIncidencias(data);
      }
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

  // Formateador helper para empleados
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

  // Pasar a Etapa 2: Mantenimiento
  const handlePonerEnMantenimiento = async (idIncidencia: number) => {
    if (!textoNota.trim()) {
      setErrorValidacion('Ingrese la nota de mantenimiento.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/incidencias/${idIncidencia}/mantenimiento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notaMantenimiento: textoNota.trim(),
          idEmpleadoMantenimiento: getUsuarioActualId()
        })
      });

      if (res.ok) {
        setMaquina({ ...maquina, estado: 'MANTENIMIENTO' });
        limpiarFormulario();
        cargarHistorial();
        onIncidenciaResuelta();
      }
    } catch (err) {
      alert("Error al pasar a mantenimiento.");
    }
  };

  // Pasar a Etapa 3: Alta Operativa
  const handleResolver = async (idIncidencia: number) => {
    if (!textoNota.trim()) {
      setErrorValidacion('Ingrese el detalle de la solución.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/incidencias/${idIncidencia}/resolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resolucion: textoNota.trim(),
          idEmpleadoResuelve: getUsuarioActualId()
        })
      });

      if (res.ok) {
        setMaquina({ ...maquina, estado: 'OPERATIVA' });
        limpiarFormulario();
        cargarHistorial();
        onIncidenciaResuelta();
      }
    } catch (err) {
      alert("Error al resolver la incidencia.");
    }
  };

  // Confirmar Egreso de Dinero
  const ejecutarPagoMantenimiento = async (forzar: boolean = false) => {
    if (!incidenciaAPagar?.idIncidencia) return;
    if (!montoPago || Number(montoPago) <= 0) {
      alert("Ingrese un monto válido.");
      return;
    }

    setProcesandoPago(true);
    try {
      const res = await fetch(`http://localhost:8080/api/incidencias/${incidenciaAPagar.idIncidencia}/pago-mantenimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: Number(montoPago),
          metodoPago,
          descripcion: conceptoPago.trim() || `Pago reparación ${maquina.nombre}`,
          idUsuario: getUsuarioActualId(),
          forzarSaldoInsuficiente: forzar
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("¡Egreso registrado correctamente en caja como Pago de Mantenimiento!");
        
        // Marcamos la incidencia como pagada en el estado local
        if (incidenciaAPagar.idIncidencia) {
          setIncidenciasPagadas(prev => [...prev, incidenciaAPagar.idIncidencia!]);
        }

        setIncidenciaAPagar(null);
        setShowModalSaldoInsuficiente(false);
        setMontoPago('');
        setConceptoPago('');
        cargarHistorial();
      } else {
        if (data.code === 'CAJA_CERRADA') {
          alert("Error: La caja se encuentra CERRADA. Inicie el turno de caja antes de realizar pagos.");
        } else if (data.code === 'SALDO_INSUFFICIENT') {
          setMensajeErrorSaldo(data.message || 'El saldo en caja es menor al monto ingresado.');
          setShowModalSaldoInsuficiente(true);
        } else {
          alert(data.message || "Error al procesar el pago.");
        }
      }
    } catch (err) {
      alert("Error de conexión al registrar pago.");
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
        <div className="modal-content" style={{ backgroundColor: '#1e1e24', color: '#ffffff', borderRadius: '12px', border: '1px solid #3f3f46' }}>
          
          {/* Header */}
          <div className="modal-header d-flex justify-content-between align-items-center" style={{ borderBottom: '2px solid #3f3f46', padding: '16px 24px' }}>
            <div className="d-flex align-items-center gap-3">
              <h5 className="modal-title font-monospace fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-info"></i>
                Historial de Incidencias: <span className="text-warning">{maquina.nombre}</span>
              </h5>
              {renderBadgeEstado(maquina.estado)}
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {cargando ? (
              <div className="text-center py-5 text-white-50 font-monospace">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando historial de incidencias...
              </div>
            ) : incidencias.length === 0 ? (
              <div className="text-center py-5 text-white-50 font-monospace" style={{ backgroundColor: '#27272a', borderRadius: '8px', border: '1px solid #3f3f46' }}>
                <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                Sin registros técnicos para este equipo.
              </div>
            ) : (
              <div className="d-flex flex-column gap-4 font-monospace">
                {incidencias.map((inc) => {
                  const esResuelta = inc.estadoIncidencia === 'RESUELTA';
                  const tieneMantenimiento = Boolean(inc.notaMantenimiento);
                  const esMantenimientoActivo = !esResuelta && (maquina.estado === 'MANTENIMIENTO' || tieneMantenimiento);
                  
                  // Verifica si está pagado desde backend o desde la sesión actual
                  const esPagado = Boolean(inc.pagado) || (inc.idIncidencia ? incidenciasPagadas.includes(inc.idIncidencia) : false);

                  return (
                    <div 
                      key={inc.idIncidencia} 
                      className="p-3 rounded-3 shadow" 
                      style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    >
                      {/* Cabecera Tarjeta */}
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold font-monospace text-white-50">Incidencia #{inc.idIncidencia}</span>
                          <span className={`badge ${
                            inc.prioridad === 'CRITICA' || inc.prioridad === 'ALTA' ? 'bg-danger' :
                            inc.prioridad === 'MEDIA' ? 'bg-warning text-dark' : 'bg-info text-dark'
                          }`}>
                            PRIORIDAD {inc.prioridad || 'MEDIA'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          
                          {/* BOTÓN CON ESTADO DINÁMICO DE PAGO */}
                          {esPagado ? (
                            <span 
                              className="bg-success text-white font-semibold px-2 py-1 rounded flex items-center gap-1 fw-bold"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-check-circle-fill me-1"></i> Pago hecho
                            </span>
                          ) : (
                            <button 
                              className="btn btn-xs btn-outline-danger fw-bold py-0 px-2"
                              style={{ fontSize: '0.78rem' }}
                              onClick={() => {
                                setIncidenciaAPagar(inc);
                                setMontoPago('');
                                setConceptoPago(`Pago mantenimiento ${maquina.nombre} - Ticket #${inc.idIncidencia}`);
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
                            backgroundColor: '#27272a', 
                            borderLeft: '4px solid #dc3545'
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="badge bg-danger d-flex align-items-center gap-1">
                                  <i className="bi bi-exclamation-octagon-fill"></i> 1. REPORTADO
                                </span>
                                <small className="text-white-50" style={{ fontSize: '0.72rem' }}>
                                  {inc.fechaReporte ? new Date(inc.fechaReporte).toLocaleString() : '-'}
                                </small>
                              </div>
                              <p className="mb-2 text-white fw-medium" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                {inc.descripcion}
                              </p>
                            </div>
                            <div className="text-white-50 small pt-2 border-top border-secondary mt-2" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-person-fill text-warning me-1"></i>
                              Reportó: <strong className="text-white">{formatEmpleado(inc.empleadoReporta, 'Sistema')}</strong>
                            </div>
                          </div>
                        </div>

                        {/* ETAPA 2: NOTA DE MANTENIMIENTO */}
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ 
                            backgroundColor: '#27272a', 
                            borderLeft: `4px solid ${tieneMantenimiento || esMantenimientoActivo ? '#ffc107' : '#6c757d'}`
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`badge ${tieneMantenimiento || esMantenimientoActivo ? 'bg-warning text-dark' : 'bg-secondary'} d-flex align-items-center gap-1`}>
                                  <i className="bi bi-tools"></i> 2. MANTENIMIENTO
                                </span>
                                <small className="text-white-50" style={{ fontSize: '0.72rem' }}>
                                  {inc.fechaMantenimiento ? new Date(inc.fechaMantenimiento).toLocaleString() : (esResuelta ? 'COMPLETADO' : 'PENDIENTE')}
                                </small>
                              </div>

                              {idAccionActiva === inc.idIncidencia && tipoAccion === 'MANTENIMIENTO' ? (
                                <div className="mt-1">
                                  <textarea
                                    className="form-control form-control-sm bg-dark text-white border-secondary mb-2"
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
                                    <button className="btn btn-xs btn-outline-light py-0 px-2" onClick={limpiarFormulario}>Cancelar</button>
                                    <button className="btn btn-xs btn-warning fw-bold text-dark py-0 px-2" onClick={() => handlePonerEnMantenimiento(inc.idIncidencia!)}>Guardar</button>
                                  </div>
                                </div>
                              ) : inc.notaMantenimiento ? (
                                <p className="mb-2 text-warning fw-medium" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                  {inc.notaMantenimiento}
                                </p>
                              ) : (
                                <div className="text-center py-2">
                                  <button
                                    className="btn btn-outline-warning btn-sm fw-bold px-2 py-1 shadow"
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

                            <div className="text-white-50 small pt-2 border-top border-secondary mt-2" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-gear-fill text-info me-1"></i>
                              Técnico: <strong className="text-white">{formatEmpleado(inc.empleadoMantenimiento, 'En taller')}</strong>
                            </div>
                          </div>
                        </div>

                        {/* ETAPA 3: RESOLUCIÓN / ALTA */}
                        <div className="col-md-4">
                          <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ 
                            backgroundColor: '#27272a', 
                            borderLeft: `4px solid ${esResuelta ? '#20c997' : '#6c757d'}`
                          }}>
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`badge ${esResuelta ? 'bg-success' : 'bg-secondary'} d-flex align-items-center gap-1`}>
                                  <i className="bi bi-check-circle-fill"></i> 3. ALTA OPERATIVA
                                </span>
                                {esResuelta && (
                                  <small className="text-white-50" style={{ fontSize: '0.72rem' }}>
                                    {inc.fechaResolucion ? new Date(inc.fechaResolucion).toLocaleString() : '-'}
                                  </small>
                                )}
                              </div>

                              {idAccionActiva === inc.idIncidencia && tipoAccion === 'RESOLVER' ? (
                                <div className="mt-1">
                                  <textarea
                                    className="form-control form-control-sm bg-dark text-white border-secondary mb-2"
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
                                    <button className="btn btn-xs btn-outline-light py-0 px-2" onClick={limpiarFormulario}>Cancelar</button>
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

                            <div className="text-white-50 small pt-2 border-top border-secondary mt-2" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-wrench-adjustable text-success me-1"></i>
                              Resuelto por: <strong className="text-white">{formatEmpleado(inc.empleadoResuelve, 'Pendiente')}</strong>
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

          <div className="modal-footer" style={{ borderTop: '1px solid #3f3f46', padding: '12px 24px' }}>
            <button type="button" className="btn btn-outline-light font-monospace" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>

      {/* --- MODAL PARA REGISTRAR PAGO DE MANTENIMIENTO --- */}
      {incidenciaAPagar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #dc3545', borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-cash-stack me-2"></i>Registrar Egreso por Mantenimiento
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIncidenciaAPagar(null)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-white-50 mb-3">
                  Este egreso quedará categorizado como <strong className="text-warning">"EGRESO_MANTENIMIENTO"</strong> e impactará directamente sobre el saldo del turno de caja activo.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-bold">Monto pagado ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control bg-dark text-white border-secondary fs-5"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Medio de Pago:</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
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
                    className="form-control bg-dark text-white border-secondary"
                    value={conceptoPago}
                    onChange={(e) => setConceptoPago(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-outline-light" onClick={() => setIncidenciaAPagar(null)} disabled={procesandoPago}>
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
            <div className="modal-content text-white font-monospace" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107', borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Saldo en Caja Insuficiente
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModalSaldoInsuficiente(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-white">{mensajeErrorSaldo}</p>
                <p className="small text-white-50 m-0">
                  ¿Desea autorizar y registrar este egreso de todos modos dejando la caja en negativo?
                </p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-secondary px-3" onClick={() => setShowModalSaldoInsuficiente(false)} disabled={procesandoPago}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-warning fw-bold text-dark px-4" onClick={() => ejecutarPagoMantenimiento(true)} disabled={procesandoPago}>
                  {procesandoPago ? 'Procesando...' : 'Aceptar igual'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};