import React, { useEffect, useState } from 'react';
import type { Maquina } from '../../types/Maquina';
import type { Incidencia } from '../../types/Incidencia';

interface Props {
  show: boolean;
  maquina: Maquina | null;
  onClose: () => void;
  onIncidenciaResuelta: () => void;
}

export const HistorialIncidenciasModal: React.FC<Props> = ({ show, maquina, onClose, onIncidenciaResuelta }) => {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(false);
  
  // Estado para la resolución activa
  const [resolviendoId, setResolviendoId] = useState<number | null>(null);
  const [textoResolucion, setTextoResolucion] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

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
      setResolviendoId(null);
      setTextoResolucion('');
      setErrorValidacion('');
    }
  }, [show, maquina]);

  if (!show || !maquina) return null;

  const handleResolverSubmit = async (idIncidencia: number) => {
    if (!textoResolucion.trim()) {
      setErrorValidacion('Es obligatorio describir el arreglo o solución aplicada.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/incidencias/${idIncidencia}/resolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolucion: textoResolucion.trim() })
      });

      if (res.ok) {
        setResolviendoId(null);
        setTextoResolucion('');
        setErrorValidacion('');
        cargarHistorial();
        onIncidenciaResuelta();
      }
    } catch (err) {
      alert("Error al intentar guardar la solución de la incidencia.");
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ backgroundColor: '#1e1e24', color: '#ffffff', borderRadius: '10px', border: '1px solid #3f3f46' }}>
          
          {/* Header */}
          <div className="modal-header" style={{ borderBottom: '2px solid #3f3f46', padding: '16px 24px' }}>
            <h5 className="modal-title font-monospace fw-bold text-white d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-info"></i>
              Historial de Incidencias: <span className="text-warning">{maquina.nombre}</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {cargando ? (
              <div className="text-center py-5 text-white-50">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando historial de mantenimientos...
              </div>
            ) : incidencias.length === 0 ? (
              <div className="text-center py-5 text-white-50" style={{ backgroundColor: '#27272a', borderRadius: '8px', border: '1px solid #3f3f46' }}>
                <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
                No hay fallas ni incidencias registradas para este equipo.
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>ID / Prioridad</th>
                      <th style={{ padding: '12px', width: '38%' }}>1. Falla Reportada (Origen)</th>
                      <th style={{ padding: '12px', width: '42%' }}>2. Resolución / Arreglo</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidencias.map((inc) => (
                      <tr 
                        key={inc.idIncidencia} 
                        style={{ borderBottom: '1px solid #2d2d30', verticalAlign: 'top' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* ID y Prioridad */}
                        <td style={{ padding: '12px' }}>
                          <span className="fw-bold text-white-50 d-block">#{inc.idIncidencia}</span>
                          <span className={`badge mt-1 ${
                            inc.prioridad === 'CRITICA' || inc.prioridad === 'ALTA' ? 'bg-danger' :
                            inc.prioridad === 'MEDIA' ? 'bg-warning text-dark' : 'bg-secondary'
                          }`}>
                            {inc.prioridad || 'MEDIA'}
                          </span>
                        </td>

                        {/* Detalle de Falla */}
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-danger text-white">FALLA</span>
                            <small className="text-white-50">
                              <i className="bi bi-calendar3 me-1"></i>
                              {new Date(inc.fechaReporte || '').toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-1 text-white fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
                            {inc.descripcion}
                          </p>
                          {inc.empleadoReporta && (
                            <small className="text-white-50 d-block" style={{ fontSize: '0.8rem' }}>
                              <i className="bi bi-person me-1"></i>
                              Reportó: {inc.empleadoReporta.persona ? `${inc.empleadoReporta.persona.nombre} ${inc.empleadoReporta.persona.apellido}` : `Empleado #${inc.empleadoReporta.idEmpleado}`}
                            </small>
                          )}
                        </td>

                        {/* Detalle del Arreglo */}
                        <td style={{ padding: '12px' }}>
                          {inc.estadoIncidencia === 'RESUELTA' ? (
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="badge bg-success text-white">RESUELTO</span>
                                <small className="text-white-50">
                                  <i className="bi bi-calendar-check me-1"></i>
                                  {new Date(inc.fechaResolucion || '').toLocaleString()}
                                </small>
                              </div>
                              <p className="mb-1 text-info fw-semibold" style={{ whiteSpace: 'pre-wrap' }}>
                                {inc.resolucion}
                              </p>
                              {inc.empleadoResuelve && (
                                <small className="text-white-50 d-block" style={{ fontSize: '0.8rem' }}>
                                  <i className="bi bi-tools me-1"></i>
                                  Reparó: {inc.empleadoResuelve.persona ? `${inc.empleadoResuelve.persona.nombre} ${inc.empleadoResuelve.persona.apellido}` : `Empleado #${inc.empleadoResuelve.idEmpleado}`}
                                </small>
                              )}
                            </div>
                          ) : resolviendoId === inc.idIncidencia ? (
                            <div className="p-2 rounded" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107' }}>
                              <label className="form-label text-warning small fw-bold mb-1">
                                Detalle de la Solución (Obligatorio):
                              </label>
                              <textarea
                                className="form-control form-control-sm bg-dark text-white border-secondary mb-2"
                                rows={2}
                                value={textoResolucion}
                                onChange={(e) => {
                                  setTextoResolucion(e.target.value);
                                  if (errorValidacion) setErrorValidacion('');
                                }}
                                placeholder="Escriba detalladamente qué se arregló, repuestos cambiados, etc..."
                              />
                              {errorValidacion && (
                                <small className="text-danger d-block mb-2 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                  <i className="bi bi-exclamation-circle me-1"></i>{errorValidacion}
                                </small>
                              )}
                              <div className="d-flex gap-2 justify-content-end">
                                <button 
                                  className="btn btn-sm btn-outline-light" 
                                  onClick={() => {
                                    setResolviendoId(null);
                                    setErrorValidacion('');
                                  }}
                                >
                                  Cancelar
                                </button>
                                <button 
                                  className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1"
                                  onClick={() => handleResolverSubmit(inc.idIncidencia!)}
                                >
                                  <i className="bi bi-check2-circle"></i> Confirmar Arreglo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center h-100">
                              <span className="badge bg-warning text-dark me-2">PENDIENTE DE REPARACIÓN</span>
                            </div>
                          )}
                        </td>

                        {/* Botón de Acción */}
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {inc.estadoIncidencia === 'PENDIENTE' && resolviendoId !== inc.idIncidencia && (
                            <button
                              onClick={() => {
                                setResolviendoId(inc.idIncidencia!);
                                setTextoResolucion('');
                                setErrorValidacion('');
                              }}
                              className="btn btn-outline-warning btn-sm d-inline-flex align-items-center justify-content-center"
                              style={{ height: '32px', color: '#ffc107', borderColor: '#ffc107' }}
                              title="Resolver / Registrar Arreglo"
                            >
                              <i className="bi bi-wrench me-1"></i> Resolver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid #3f3f46', padding: '12px 24px' }}>
            <button type="button" className="btn btn-outline-light" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};