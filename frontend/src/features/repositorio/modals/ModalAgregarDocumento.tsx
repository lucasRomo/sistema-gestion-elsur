import React, { useState, useRef } from 'react';
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

  // Referencia para sincronizar el input de tipo file al arrastrar
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  if (!show) return null;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileDropped = e.dataTransfer.files[0];
      setArchivo(fileDropped);

      // Sincronizar el archivo en el input HTML para que muestre el nombre en el navegador
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(fileDropped);
        fileInputRef.current.files = dt.files;
      }

      e.dataTransfer.clearData();
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !idArea || !titulo || !autor) return;
    setMostrarConfirmar(true);
  };

  const handleConfirmarGuardar = async () => {
    setMostrarConfirmar(false);

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('autor', autor);
    formData.append('descripcion', descripcion);
    formData.append('idArea', idArea);
    formData.append('precioBase', precioBase);
    if (cantidadPaginas) formData.append('cantidadPaginas', cantidadPaginas);
    if (archivo) formData.append('archivo', archivo);

    try {
      await onGuardar(formData);
      setMostrarExito(true);
    } catch (error) {
      console.error('Error al guardar documento:', error);
    }
  };

  const handleCerrarTodo = () => {
    setMostrarExito(false);
    setTitulo('');
    setAutor('');
    setDescripcion('');
    setIdArea('');
    setPrecioBase('0');
    setCantidadPaginas('');
    setArchivo(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <>
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div
            className={`modal-content p-4 position-relative ${textColor}`}
            style={{
              backgroundColor: cardBg,
              border: '2px solid #8e45e0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(27, 27, 27, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                  border: '3px dashed #8e45e0',
                  borderRadius: '12px',
                  zIndex: 100,
                  backdropFilter: 'blur(3px)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '80px', height: '80px', backgroundColor: 'rgba(142, 69, 224, 0.15)' }}
                >
                  <i className="bi bi-paperclip" style={{ fontSize: '3rem', color: '#8e45e0' }}></i>
                </div>
                <h5 className="fw-bold text-white mb-1">Suelta los archivos aquí</h5>
                <p className="text-secondary small">El archivo seleccionado se vinculará automáticamente al registro</p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
              <h5 className="modal-title fw-bold">Registrar Archivo en Repositorio</h5>
              <button
                className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`}
                onClick={handleCerrarTodo}
              ></button>
            </div>

            <form onSubmit={handlePreSubmit}>
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
                          {a.nombreArea}{a.institucion?.nombreInstitucion ? ` (${a.institucion.nombreInstitucion})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      title="Agregar Cátedra"
                      onClick={onAbrirNuevaArea}
                    >
                      <i className="bi bi-gear-fill"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      title="Agregar Institución"
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
                    Cant. Páginas (Opcional)
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
  
  {/* Input oculto mantenido con ref para la validación HTML y Drag&Drop */}
  <input
    ref={fileInputRef}
    id="archivo-input"
    type="file"
    className="d-none"
    required={!archivo}
    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
    onChange={(e) => {
      if (e.target.files && e.target.files[0]) {
        setArchivo(e.target.files[0]);
      }
    }}
  />

  <div className="d-flex align-items-center gap-2">
    {/* Botón a la izquierda fuera del recuadro */}
    <label
      htmlFor="archivo-input"
      className="btn px-3 text-nowrap cursor-pointer mb-0"
      style={{ cursor: 'pointer', backgroundColor: 'rgba(60, 156, 211, 0.91)' }}
    >
      Seleccionar archivo
    </label>

    {/* Campo de texto que muestra el estado o el nombre del archivo */}
    <div
      className="form-control d-flex align-items-center justify-content-between flex-grow-1"
      style={{
        backgroundColor: inputBg,
        borderColor: cardBorder,
        minHeight: '38px'
      }}
    >
      <span className={`small flex-grow-1 text-truncate ${archivo ? 'text-success fw-bold' : 'text-secondary'}`}>
        {archivo ? archivo.name : 'Seleccione o arrastre un archivo hacia la pantalla de Repositorio'}
      </span>
      {archivo && (
        <i className="bi bi-check-circle-fill text-success ms-2"></i>
      )}
    </div>
  </div>
</div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3 fw-bold text-white"
                  onClick={handleCerrarTodo}
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

      {mostrarConfirmar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg font-monospace text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', border: '2px solid #8e45e0' }}>
                    <i className="bi bi-question-lg" style={{ fontSize: '2rem', color: '#8e45e0' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">¿Deseas guardar este documento en el repositorio?</h6>
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button type="button" className="btn btn-sm btn-secondary px-3 fw-semibold" onClick={() => setMostrarConfirmar(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-sm text-white px-3 fw-bold" style={{ backgroundColor: '#8e45e0' }} onClick={handleConfirmarGuardar}>
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
                <h6 className="fw-bold my-2 text-white">Documento guardado con éxito</h6>
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