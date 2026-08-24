import React, { useState } from 'react';
import type { Institucion } from '../types/Repositorio';

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent) => Promise<void> | void;
  instituciones: Institucion[];
  idInst: string;
  setIdInst: (val: string) => void;
  nombre: string;
  setNombre: (val: string) => void;
  textColor: string;
  cardBg: string;
  inputBg: string;
  cardBorder: string;
  isDarkMode: boolean;
}

export const ModalCrearArea: React.FC<Props> = ({
  show,
  onClose,
  onSubmit,
  instituciones,
  idInst,
  setIdInst,
  nombre,
  setNombre,
  textColor,
  cardBg,
  inputBg,
  cardBorder,
  isDarkMode,
}) => {
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!show) return null;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarConfirmar(true);
  };

  const handleConfirmarGuardar = async () => {
    setMostrarConfirmar(false);
    setGuardando(true);
    try {
      await onSubmit();
      setMostrarExito(true);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarTodo = () => {
    setMostrarExito(false);
    onClose();
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content border-warning p-3 ${textColor}`} style={{ backgroundColor: cardBg }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-warning">
                <i className="bi bi-gear-fill me-2"></i>Nueva Cátedra / Área
              </h6>
              <button className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`} onClick={onClose}></button>
            </div>

            <form onSubmit={handlePreSubmit}>
              <div className="mb-3">
                <label className="form-label small text-secondary">Institución Perteneciente *</label>
                <select
                  className={`form-select ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  required
                  value={idInst}
                  onChange={(e) => setIdInst(e.target.value)}
                >
                  <option value="">-- Seleccionar Institución --</option>
                  {instituciones.map((inst) => (
                    <option key={inst.idInstitucion} value={inst.idInstitucion}>
                      {inst.nombreInstitucion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Nombre de la Cátedra / Materia *</label>
                <input
                  type="text"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  placeholder="Ej: Análisis Matemático I, Historia 2..."
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm btn-danger text-white" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-sm btn-warning fw-bold text-white" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Cátedra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mostrarConfirmar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', border: '2px solid #ffc107' }}>
                    <i className="bi bi-question-lg text-warning" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">¿Deseas guardar esta cátedra/área?</h6>
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button type="button" className="btn btn-sm btn-secondary px-3 fw-semibold" onClick={() => setMostrarConfirmar(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-sm btn-warning text-white px-3 fw-bold" onClick={handleConfirmarGuardar}>
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1085 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #267c34', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', border: '2px solid #267c34' }}>
                    <i className="bi bi-check-lg" style={{ fontSize: '2.2rem', color: '#267c34' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">Cátedra/Área creada con éxito</h6>
                <button
                  type="button"
                  className="btn btn-sm px-4 fw-bold mt-2 text-white"
                  style={{ backgroundColor: '#267c34', borderRadius: '6px', border: 'none' }}
                  onClick={handleCerrarTodo}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};