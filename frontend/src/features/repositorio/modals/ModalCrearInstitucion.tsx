import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  nombre: string;
  setNombre: (val: string) => void;
  tipo: string;
  setTipo: (val: string) => void;
  textColor: string;
  cardBg: string;
  inputBg: string;
  cardBorder: string;
  isDarkMode: boolean;
}

export const ModalCrearInstitucion: React.FC<Props> = ({
  show,
  onClose,
  onSubmit,
  nombre,
  setNombre,
  tipo,
  setTipo,
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
        <div className={`modal-content border-info p-3 ${textColor}`} style={{ backgroundColor: cardBg }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 text-info">
              <i className="bi bi-building-gear me-2"></i>Nueva Institución
            </h6>
            <button className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label small text-secondary">Nombre de Institución *</label>
              <input
                type="text"
                className={`form-control ${textColor}`}
                style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                placeholder="Ej: UNL, UTN, Colegio Nacional..."
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small text-secondary">Tipo</label>
              <select
                className={`form-select ${textColor}`}
                style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="Universidad">Universidad</option>
                <option value="Instituto">Instituto / Terciario</option>
                <option value="Secundaria">Secundaria / Escuela</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-sm btn-secondary text-white" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-info fw-bold text-white">
                Guardar Institución
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};