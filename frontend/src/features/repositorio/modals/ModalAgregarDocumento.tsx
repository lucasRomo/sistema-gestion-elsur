import React, { useState } from 'react';
import type { AreaCurso } from '../types/Repositorio';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  show: boolean;
  areas: AreaCurso[];
  guardando: boolean;
  onClose: () => void;
  onGuardar: (formData: FormData) => Promise<void>;
  onAbrirNuevaArea: () => void;
  onAbrirNuevaInst: () => void;
}

export const ModalAgregarDocumento: React.FC<Props> = ({
  show,
  areas,
  guardando,
  onClose,
  onGuardar,
  onAbrirNuevaArea,
  onAbrirNuevaInst,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const textColor = isDarkMode ? 'text-white' : 'text-dark';
  const cardBg = isDarkMode ? '#1b1b1b' : '#ffffff';
  const cardBorder = isDarkMode ? '#3f3f46' : '#dee2e6';
  const inputBg = isDarkMode ? '#1b1b1b' : '#ffffff';

  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idArea, setIdArea] = useState('');
  const [precioBase, setPrecioBase] = useState('0');
  const [cantidadPaginas, setCantidadPaginas] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !idArea || !titulo || !autor) {
      alert('Por favor complete los campos obligatorios y seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('autor', autor);
    formData.append('descripcion', descripcion);
    formData.append('idArea', idArea);
    formData.append('precioBase', precioBase);
    if (cantidadPaginas) formData.append('cantidadPaginas', cantidadPaginas);
    formData.append('archivo', archivo);

    await onGuardar(formData);
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className={`modal-content p-4 ${textColor}`}
          style={{ backgroundColor: cardBg, border: '2px solid #8e45e0', borderRadius: '12px' }}
        >
          <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
            <h5 className="modal-title fw-bold">Registrar Archivo en Repositorio</h5>
            <button
              className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`}
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small text-secondary fw-bold">Título del Documento *</label>
                <input
                  type="text"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-secondary fw-bold">Autor / Docente *</label>
                <input
                  type="text"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  required
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                />
              </div>

              <div className="col-md-8">
                <label className="form-label small text-secondary fw-bold">Cátedra / Materia (Área) *</label>
                <div className="input-group">
                  <select
                    className={`form-select ${textColor}`}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                    required
                    value={idArea}
                    onChange={(e) => setIdArea(e.target.value)}
                  >
                    <option value="">-- Seleccionar Cátedra --</option>
                    {areas.map((a) => (
                      <option key={a.idArea} value={a.idArea}>
                        {a.nombreArea} ({a.institucion?.nombreInstitucion})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Administrar / Agregar Cátedra"
                    onClick={onAbrirNuevaArea}
                  >
                    <i className="bi bi-gear-fill"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    title="Administrar / Agregar Institución"
                    onClick={onAbrirNuevaInst}
                  >
                    <i className="bi bi-building-add"></i>
                  </button>
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary fw-bold">Precio Base ($)</label>
                <input
                  type="number"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  min="0"
                  step="0.01"
                  value={precioBase}
                  onChange={(e) => setPrecioBase(e.target.value)}
                />
              </div>

              <div className="col-md-12">
                <label className="form-label small text-secondary fw-bold">
                  Cant. Páginas (Opcional - Se detecta automáticamente si es PDF)
                </label>
                <input
                  type="number"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  min="1"
                  placeholder="Auto-detectado si se deja vacío"
                  value={cantidadPaginas}
                  onChange={(e) => setCantidadPaginas(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small text-secondary fw-bold">Descripción / Notas</label>
                <textarea
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label small text-secondary fw-bold">
                  Archivo Digital (PDF / DOCX / JPG / PNG) *
                </label>
                <input
                  type="file"
                  className={`form-control ${textColor}`}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                  required
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivo(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-danger btn-sm px-3 fw-bold"
                style={{ color: '#ffffff' }}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm px-4 fw-bold text-white"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar en Repositorio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};