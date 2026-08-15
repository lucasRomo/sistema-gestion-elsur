import React from 'react';
import type { Institucion } from '../types/Repositorio';

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
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
  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className={`modal-content border-warning p-3 ${textColor}`} style={{ backgroundColor: cardBg }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 text-warning">
              <i className="bi bi-gear-fill me-2"></i>Nueva Cátedra / Área
            </h6>
            <button className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <form onSubmit={onSubmit}>
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
                placeholder="Ej: Análisis Matemático I, Historia..."
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-sm btn-danger text-white" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-warning fw-bold text-white">
                Guardar Cátedra
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};