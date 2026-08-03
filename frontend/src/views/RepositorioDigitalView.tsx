import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { repositorioService } from '../services/repositorioService';
import type { DocumentoDigital, AreaCurso, Institucion } from '../types/Repositorio';

export const RepositorioDigitalView: React.FC = () => {
  const navigate = useNavigate();

  const [documentos, setDocumentos] = useState<DocumentoDigital[]>([]);
  const [areas, setAreas] = useState<AreaCurso[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);

  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroMateria, setFiltroMateria] = useState<string>('');
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('');

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoDigital | null>(null);

  // Modales Principales
  const [modalAgregar, setModalAgregar] = useState<boolean>(false);
  const [modalPrevisualizar, setModalPrevisualizar] = useState<boolean>(false);

  // Modales Rápidos (Engranajes)
  const [modalNuevaInst, setModalNuevaInst] = useState<boolean>(false);
  const [modalNuevaArea, setModalNuevaArea] = useState<boolean>(false);

  // Formulario Documento
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idArea, setIdArea] = useState('');
  const [precioBase, setPrecioBase] = useState('0');
  const [cantidadPaginas, setCantidadPaginas] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario Institución Rápida
  const [nombreInstNueva, setNombreInstNueva] = useState('');
  const [tipoInstNueva, setTipoInstNueva] = useState('Universidad');

  // Formulario Área / Cátedra Rápida
  const [nombreAreaNueva, setNombreAreaNueva] = useState('');
  const [idInstParaArea, setIdInstParaArea] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [docsData, areasData, instsData] = await Promise.all([
        repositorioService.getDocumentos(),
        repositorioService.getAreas(),
        repositorioService.getInstituciones(),
      ]);
      setDocumentos(docsData);
      setAreas(areasData);
      setInstituciones(instsData);
      if (docsData.length > 0) {
        setDocumentoSeleccionado(docsData[0]);
      }
    } catch (error) {
      console.error('Error al cargar datos del repositorio:', error);
    } finally {
      setCargando(false);
    }
  };

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const coincideBusqueda =
        doc.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.autor.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.area?.nombreArea?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideMateria =
        !filtroMateria || doc.area?.idArea?.toString() === filtroMateria;

      const coincideInst =
        !filtroInstitucion ||
        doc.area?.institucion?.idInstitucion?.toString() === filtroInstitucion;

      return coincideBusqueda && coincideMateria && coincideInst;
    });
  }, [documentos, busqueda, filtroMateria, filtroInstitucion]);

  const handleEliminar = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('¿Está seguro de eliminar de forma lógica este documento?')) return;

    try {
      await repositorioService.eliminarDocumento(id);
      const listaNueva = documentos.filter((d) => d.idDocumento !== id);
      setDocumentos(listaNueva);
      if (documentoSeleccionado?.idDocumento === id) {
        setDocumentoSeleccionado(listaNueva[0] || null);
      }
    } catch (err) {
      alert('Error al eliminar el documento');
    }
  };

  const handleGuardarNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !idArea || !titulo || !autor) {
      alert('Por favor complete los campos obligatorios y seleccione un archivo.');
      return;
    }

    try {
      setGuardando(true);
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('autor', autor);
      formData.append('descripcion', descripcion);
      formData.append('idArea', idArea);
      formData.append('precioBase', precioBase);
      if (cantidadPaginas) {
        formData.append('cantidadPaginas', cantidadPaginas);
      }
      formData.append('archivo', archivo);

      const nuevoDoc = await repositorioService.subirDocumento(formData);
      setDocumentos([nuevoDoc, ...documentos]);
      setDocumentoSeleccionado(nuevoDoc);
      setModalAgregar(false);

      // Limpiar Formulario
      setTitulo('');
      setAutor('');
      setDescripcion('');
      setIdArea('');
      setPrecioBase('0');
      setCantidadPaginas('');
      setArchivo(null);
    } catch (err) {
      alert('Error al registrar el archivo en el repositorio.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearInstitucionRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInstNueva.trim()) return;

    try {
      const nueva = await repositorioService.crearInstitucion(nombreInstNueva, tipoInstNueva);
      setInstituciones([...instituciones, nueva]);
      setModalNuevaInst(false);
      setNombreInstNueva('');
    } catch (err) {
      alert('Error al crear la institución.');
    }
  };

  const handleCrearAreaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreAreaNueva.trim() || !idInstParaArea) {
      alert('Seleccione la institución y el nombre de la cátedra/materia.');
      return;
    }

    try {
      const nuevaArea = await repositorioService.crearArea(nombreAreaNueva, parseInt(idInstParaArea));
      setAreas([...areas, nuevaArea]);
      setIdArea(nuevaArea.idArea.toString());
      setModalNuevaArea(false);
      setNombreAreaNueva('');
      setIdInstParaArea('');
    } catch (err) {
      alert('Error al crear la cátedra/materia.');
    }
  };

  const formatearTamano = (bytes: number) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getIconoArchivo = (tipo: string) => {
    const ext = tipo?.toUpperCase();
    if (ext === 'PDF') return <i className="bi bi-file-earmark-pdf-fill text-danger fs-3"></i>;
    if (ext === 'DOCX' || ext === 'DOC') return <i className="bi bi-file-earmark-word-fill text-primary fs-3"></i>;
    if (ext === 'JPG' || ext === 'PNG' || ext === 'JPEG') return <i className="bi bi-file-earmark-image-fill text-warning fs-3"></i>;
    return <i className="bi bi-file-earmark-text-fill text-secondary fs-3"></i>;
  };

  return (
    <div className="container-fluid text-white min-vh-100 p-2 font-monospace">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0 text-white">Repositorio Digital</h2>
        <i className="bi bi-question-circle text-info fs-4" style={{ cursor: 'pointer' }}></i>
      </div>

      <div className="row g-3">
        {/* PANEL IZQUIERDO */}
        <div className="col-lg-7">
          <div className="card bg-dark text-white p-3 border-secondary rounded-3">
            <h5 className="fw-bold mb-3 text-light">Buscador y Filtros</h5>

            {/* BÚSQUEDA */}
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Buscar por título, autor o materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="input-group-text bg-dark border-secondary text-secondary">
                <i className="bi bi-search"></i>
              </span>
            </div>

            {/* FILTROS Y BOTÓN AGREGAR */}
            <div className="row g-2 mb-3 align-items-center">
              <div className="col-md-5">
                <label className="small text-secondary fw-bold mb-1">Filtrar por Materia:</label>
                <select
                  className="form-select bg-dark text-white border-secondary form-select-sm"
                  value={filtroMateria}
                  onChange={(e) => setFiltroMateria(e.target.value)}
                >
                  <option value="">Sin Filtro</option>
                  {areas.map((a) => (
                    <option key={a.idArea} value={a.idArea}>
                      {a.nombreArea}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="small text-secondary fw-bold mb-1">Filtrar por Institución:</label>
                <select
                  className="form-select bg-dark text-white border-secondary form-select-sm"
                  value={filtroInstitucion}
                  onChange={(e) => setFiltroInstitucion(e.target.value)}
                >
                  <option value="">Sin Filtro</option>
                  {instituciones.map((i) => (
                    <option key={i.idInstitucion} value={i.idInstitucion}>
                      {i.nombreInstitucion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <button
                  className="btn btn-sm w-100 fw-bold text-white mt-3"
                  style={{ backgroundColor: '#28a745' }}
                  onClick={() => setModalAgregar(true)}
                >
                  Agregar Documento
                </button>
              </div>
            </div>

            {/* TABLA DE ARCHIVOS */}
            <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="text-secondary border-secondary small">
                    <th>Icono</th>
                    <th>Nombre Arch.</th>
                    <th>Materia</th>
                    <th>Carrera / Inst.</th>
                    <th className="text-center">Opciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        Cargando repositorio...
                      </td>
                    </tr>
                  ) : documentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No se encontraron archivos en el repositorio.
                      </td>
                    </tr>
                  ) : (
                    documentosFiltrados.map((doc) => {
                      const esSeleccionado = documentoSeleccionado?.idDocumento === doc.idDocumento;
                      return (
                        <tr
                          key={doc.idDocumento}
                          onClick={() => setDocumentoSeleccionado(doc)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: esSeleccionado ? '#2d2d30' : 'transparent',
                            borderLeft: esSeleccionado ? '4px solid #8e45e0' : 'none',
                          }}
                        >
                          <td>{getIconoArchivo(doc.tipoArchivo)}</td>
                          <td className="fw-bold text-truncate" style={{ maxWidth: '150px' }}>
                            {doc.titulo}
                          </td>
                          <td className="text-truncate" style={{ maxWidth: '120px' }}>
                            {doc.area?.nombreArea || 'S/N'}
                          </td>
                          <td className="text-truncate" style={{ maxWidth: '120px' }}>
                            {doc.area?.institucion?.nombreInstitucion || 'S/N'}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm text-danger border-0 p-0 ms-1"
                              title="Eliminar de forma lógica"
                              onClick={(e) => handleEliminar(e, doc.idDocumento)}
                            >
                              <i className="bi bi-x-square-fill fs-5"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="col-lg-5">
          <div
            className="card bg-dark text-white p-3 border-secondary rounded-3 d-flex flex-column justify-content-between"
            style={{ minHeight: '520px' }}
          >
            {documentoSeleccionado ? (
              <>
                <div>
                  <div
                    className="d-flex flex-column align-items-center justify-content-center p-4 rounded mb-3"
                    style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', minHeight: '200px' }}
                  >
                    {getIconoArchivo(documentoSeleccionado.tipoArchivo)}
                    <span className="fw-bold mt-2 text-info fs-5 text-center">
                      {documentoSeleccionado.nombreArchivoOriginal}
                    </span>
                    <span className="badge bg-secondary mt-1 font-monospace">
                      {documentoSeleccionado.tipoArchivo?.toUpperCase()}
                    </span>
                  </div>

                  <div className="small space-y-2">
                    <p className="mb-1">
                      <strong className="text-secondary">Nombre:</strong> {documentoSeleccionado.titulo}
                    </p>
                    <p className="mb-1">
                      <strong className="text-secondary">Autor:</strong> {documentoSeleccionado.autor}
                    </p>
                    <p className="mb-1">
                      <strong className="text-secondary">Cantidad de Páginas:</strong>{' '}
                      <span className="badge bg-info text-dark">{documentoSeleccionado.cantidadPaginas} pág.</span>
                    </p>
                    <p className="mb-1">
                      <strong className="text-secondary">Tamaño de Archivo:</strong>{' '}
                      {formatearTamano(documentoSeleccionado.tamanoBytes)}
                    </p>
                    <p className="mb-1">
                      <strong className="text-secondary">Institución / Cátedra:</strong>{' '}
                      {documentoSeleccionado.area?.institucion?.nombreInstitucion} —{' '}
                      {documentoSeleccionado.area?.nombreArea}
                    </p>
                    {documentoSeleccionado.producto && (
                      <p className="mb-1 text-success fw-bold">
                        Precio Base Registrado: ${documentoSeleccionado.producto.precioBase}
                      </p>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-primary btn-sm flex-fill fw-bold"
                    style={{ backgroundColor: '#5a8ab8', border: 'none' }}
                    onClick={() => setModalPrevisualizar(true)}
                  >
                    Ver (Pantalla Completa)
                  </button>
                  <button
                    className="btn btn-success btn-sm flex-fill fw-bold"
                    style={{ backgroundColor: '#28a745', border: 'none' }}
                    onClick={() => navigate('/crear-pedido')}
                  >
                    Crear Pedido de Impresión
                  </button>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted my-auto">
                <i className="bi bi-file-earmark-arrow-up fs-1 mb-2"></i>
                <p>Seleccione un documento de la lista para ver su detalle.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL REGISTRAR ARCHIVO CON ENGRANAJES */}
      {modalAgregar && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content bg-dark text-white p-4"
              style={{ border: '2px solid #8e45e0', borderRadius: '12px' }}
            >
              <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-2 mb-3">
                <h5 className="modal-title fw-bold">Registrar Archivo en Repositorio</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setModalAgregar(false)}
                ></button>
              </div>

              <form onSubmit={handleGuardarNuevo}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small text-secondary fw-bold">Título del Documento *</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      required
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small text-secondary fw-bold">Autor / Docente *</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      required
                      value={autor}
                      onChange={(e) => setAutor(e.target.value)}
                    />
                  </div>

                  {/* CÁTEDRA / MATERIA CON BOTÓN DE ENGRANAJE */}
                  <div className="col-md-8">
                    <label className="form-label small text-secondary fw-bold">Cátedra / Materia (Área) *</label>
                    <div className="input-group">
                      <select
                        className="form-select bg-dark text-white border-secondary"
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
                        className="btn btn-outline-light"
                        title="Administrar / Agregar Cátedra"
                        onClick={() => setModalNuevaArea(true)}
                      >
                        <i className="bi bi-gear-fill"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-info"
                        title="Administrar / Agregar Institución"
                        onClick={() => setModalNuevaInst(true)}
                      >
                        <i className="bi bi-building-add"></i>
                      </button>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small text-secondary fw-bold">Precio Base ($)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
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
                      className="form-control bg-dark text-white border-secondary"
                      min="1"
                      placeholder="Auto-detectado si se deja vacío"
                      value={cantidadPaginas}
                      onChange={(e) => setCantidadPaginas(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small text-secondary fw-bold">Descripción / Notas</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
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
                      className="form-control bg-dark text-white border-secondary"
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
                    className="btn btn-secondary btn-sm px-3"
                    onClick={() => setModalAgregar(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-sm px-4 fw-bold"
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar en Repositorio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÁPIDO: CREAR INSTITUCIÓN (ENGRANAJE) */}
      {modalNuevaInst && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-info p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-info">
                  <i className="bi bi-building-gear me-2"></i>Nueva Institución
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setModalNuevaInst(false)}></button>
              </div>

              <form onSubmit={handleCrearInstitucionRapida}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Nombre de Institución *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Ej: UNL, UTN, Colegio Nacional..."
                    required
                    value={nombreInstNueva}
                    onChange={(e) => setNombreInstNueva(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Tipo</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={tipoInstNueva}
                    onChange={(e) => setTipoInstNueva(e.target.value)}
                  >
                    <option value="Universidad">Universidad</option>
                    <option value="Instituto">Instituto / Terciario</option>
                    <option value="Secundaria">Secundaria / Escuela</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setModalNuevaInst(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-info fw-bold">
                    Guardar Institución
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÁPIDO: CREAR CÁTEDRA / MATERIA (ENGRANAJE) */}
      {modalNuevaArea && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-warning p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-warning">
                  <i className="bi bi-gear-fill me-2"></i>Nueva Cátedra / Área
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setModalNuevaArea(false)}></button>
              </div>

              <form onSubmit={handleCrearAreaRapida}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Institución Perteneciente *</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    required
                    value={idInstParaArea}
                    onChange={(e) => setIdInstParaArea(e.target.value)}
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
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Ej: Análisis Matemático I, Historia..."
                    required
                    value={nombreAreaNueva}
                    onChange={(e) => setNombreAreaNueva(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setModalNuevaArea(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-sm btn-warning fw-bold text-dark">
                    Guardar Cátedra
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PREVISUALIZADOR EN PANTALLA COMPLETA */}
      {modalPrevisualizar && documentoSeleccionado && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1060 }}>
          <div className="modal-dialog modal-fullscreen p-3">
            <div className="modal-content bg-dark text-white border-secondary d-flex flex-column h-100">
              <div className="modal-header border-secondary py-2">
                <h5 className="modal-title font-monospace fw-bold text-info">
                  Previsualización: {documentoSeleccionado.titulo}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalPrevisualizar(false)}
                ></button>
              </div>

              <div className="modal-body p-0 flex-grow-1 bg-black d-flex justify-content-center align-items-center">
                {documentoSeleccionado.tipoArchivo?.toUpperCase() === 'PDF' ? (
                  <iframe
                    src={repositorioService.getUrlArchivo(documentoSeleccionado.urlArchivoLocal)}
                    title={documentoSeleccionado.titulo}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                ) : ['JPG', 'JPEG', 'PNG'].includes(documentoSeleccionado.tipoArchivo?.toUpperCase() || '') ? (
                  <img
                    src={repositorioService.getUrlArchivo(documentoSeleccionado.urlArchivoLocal)}
                    alt={documentoSeleccionado.titulo}
                    style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-center p-5">
                    <i className="bi bi-file-earmark-word text-primary display-1 mb-3"></i>
                    <h4>Previsualización directa no soportada para archivos Office ({documentoSeleccionado.tipoArchivo}).</h4>
                    <a
                      href={repositorioService.getUrlArchivo(documentoSeleccionado.urlArchivoLocal)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-info mt-2"
                    >
                      Descargar / Abrir Archivo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};