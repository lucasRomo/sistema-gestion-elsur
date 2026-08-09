import React, { useState, useEffect } from 'react';
import type { Maquina } from '../types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  maquinaEditar: Maquina | null;
  onClose: () => void;
  onGuardar: (maquina: Maquina & { observacion?: string }) => Promise<void>;
}

export const MaquinaModal: React.FC<Props> = ({ show, maquinaEditar, onClose, onGuardar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de tema
  const modalBg = isDark ? '#1e1e24' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const noteBoxBg = isDark ? '#27272a' : '#f8fafc';

  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState('OPERATIVA');
  const [observacion, setObservacion] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [confirmarSinMantenimiento, setConfirmarSinMantenimiento] = useState(false);

  useEffect(() => {
    if (maquinaEditar) {
      setNombre(maquinaEditar.nombre || '');
      setEstado(maquinaEditar.estado || 'OPERATIVA');
    } else {
      setNombre('');
      setEstado('OPERATIVA');
    }
    setObservacion('');
    setErrorValidacion('');
    setConfirmarSinMantenimiento(false);
  }, [maquinaEditar, show]);

  if (!show) return null;

  const haCambiadoEstado = Boolean(maquinaEditar && maquinaEditar.estado !== estado);

  const procesarGuardado = async () => {
    setCargando(true);
    try {
      await onGuardar({
        idMaquina: maquinaEditar?.idMaquina,
        nombre: nombre.trim(),
        estado,
        observacion: observacion.trim()
      });
      setConfirmarSinMantenimiento(false);
      onClose();
    } catch (error: any) {
      alert("Error al guardar la máquina: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion('');

    if (!nombre.trim()) {
      setErrorValidacion("Ingrese un nombre de equipo válido.");
      return;
    }

    if (haCambiadoEstado && !observacion.trim()) {
      setErrorValidacion("Es obligatorio describir el motivo del cambio de estado o la solución aplicada.");
      return;
    }

    if (
      haCambiadoEstado &&
      maquinaEditar?.estado !== 'MANTENIMIENTO' &&
      estado === 'OPERATIVA' &&
      !confirmarSinMantenimiento
    ) {
      setConfirmarSinMantenimiento(true);
      return;
    }

    await procesarGuardado();
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ backgroundColor: modalBg, color: textColor, borderRadius: '12px', border: `1px solid ${modalBorder}` }}>
            
            <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
              <h5 className="modal-title font-monospace fw-bold text-warning">
                <i className="bi bi-printer me-2"></i>
                {maquinaEditar ? 'Modificar Equipo' : 'Nuevo Equipo'}
              </h5>
              <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose} disabled={cargando}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body font-monospace">
                
                {errorValidacion && (
                  <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{errorValidacion}</span>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" style={{ color: textColor }}>Nombre del Equipo / Máquina:</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Ej: Impresora Láser Ricoh C5300"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ color: textColor }}>Estado Actual:</label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={estado}
                    onChange={(e) => {
                      setEstado(e.target.value);
                      setErrorValidacion('');
                    }}
                  >
                    <option value="OPERATIVA">OPERATIVA</option>
                    <option value="FUERA DE SERVICIO">FUERA DE SERVICIO</option>
                    <option value="FALLA">FALLA</option>
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                  </select>
                </div>

                {haCambiadoEstado && (
                  <div className="p-3 mb-3 rounded" style={{ backgroundColor: noteBoxBg, border: '1px solid #ffc107' }}>
                    <label className="form-label text-warning fw-bold small mb-1">
                      <i className="bi bi-pencil-square me-1"></i> Detalle / Motivo del cambio de estado (Obligatorio):
                    </label>
                    <textarea
                      className="form-control"
                      style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                      rows={3}
                      placeholder="Escriba detalladamente qué se arregló, motivo del cambio o repuestos cambiados..."
                      value={observacion}
                      onChange={(e) => {
                        setObservacion(e.target.value);
                        if (errorValidacion) setErrorValidacion('');
                      }}
                      required
                    />
                    <small className="d-block mt-1" style={{ fontSize: '0.78rem', color: textSubtle }}>
                      * El estado cambiará de <strong>"{maquinaEditar?.estado}"</strong> a <strong>"{estado}"</strong>.
                    </small>
                  </div>
                )}

              </div>

              <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button type="button" className={`btn ${isDark ? 'btn-outline-secondary' : 'btn-outline-dark'}`} onClick={onClose} disabled={cargando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning fw-bold px-4 text-white" style={{ color: '#ffffff' }} disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      {/* Modal de Advertencia por omitir Mantenimiento */}
      {confirmarSinMantenimiento && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-warning font-monospace" style={{ backgroundColor: modalBg, color: textColor, borderRadius: '12px', border: `1px solid ${modalBorder}` }}>
              <div className="modal-header" style={{ borderBottom: `1px solid ${modalBorder}` }}>
                <h5 className="modal-title fw-bold text-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Advertencia de Cambio Directo
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setConfirmarSinMantenimiento(false)} disabled={cargando}></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-2">
                  El equipo pasará directamente a <strong className="text-success">OPERATIVA</strong> sin haber quedado registrado un ciclo previo de <strong className="text-warning">MANTENIMIENTO</strong>.
                </p>
                <p className="small mb-0" style={{ color: textSubtle }}>
                  ¿Desea confirmar el cambio y dar el alta directa?
                </p>
              </div>
              <div className="modal-footer" style={{ borderTop: `1px solid ${modalBorder}` }}>
                <button type="button" className={`btn ${isDark ? 'btn-outline-light' : 'btn-outline-secondary'}`} onClick={() => setConfirmarSinMantenimiento(false)} disabled={cargando}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-warning fw-bold text-white px-4" style={{ color: '#ffffff' }} onClick={procesarGuardado} disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Confirmar y Pasar a Operativa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};