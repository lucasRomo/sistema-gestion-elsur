import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { useRepositorioDigital } from '../hooks/useRepositorioDigital';
import { FiltrosRepositorio } from '../components/FiltrosRepositorio';
import { TablaDocumentos } from '../components/TablaDocumentos';
import { DetalleDocumento } from '../components/DetalleDocumento';
import { ModalAgregarDocumento } from '../modals/ModalAgregarDocumento';
import { ModalCrearInstitucion } from '../modals/ModalCrearInstitucion';
import { ModalCrearArea } from '../modals/ModalCrearArea';
import { ModalPrevisualizar } from '../modals/ModalPrevisualizar';

export const RepositorioDigitalView: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const pageBg = isDarkMode ? '#1b1b1b' : '#e5e7eb';
  const cardBg = isDarkMode ? '#1b1b1b' : '#ffffff';
  const textColor = isDarkMode ? 'text-white' : 'text-dark';
  const cardBorder = isDarkMode ? '#3f3f46' : '#dee2e6';
  const inputBg = isDarkMode ? '#1b1b1b' : '#ffffff';

  const {
    documentosFiltrados,
    areas,
    instituciones,
    cargando,
    busqueda,
    setBusqueda,
    filtroMateria,
    setFiltroMateria,
    filtroInstitucion,
    setFiltroInstitucion,
    documentoSeleccionado,
    setDocumentoSeleccionado,
    modalAgregar,
    setModalAgregar,
    modalPrevisualizar,
    setModalPrevisualizar,
    modalNuevaInst,
    setModalNuevaInst,
    modalNuevaArea,
    setModalNuevaArea,
    guardando,
    nombreInstNueva,
    setNombreInstNueva,
    tipoInstNueva,
    setTipoInstNueva,
    nombreAreaNueva,
    setNombreAreaNueva,
    idInstParaArea,
    setIdInstParaArea,
    handleEliminar,
    handleGuardarNuevo,
    handleCrearInstitucionRapida,
    handleCrearAreaRapida,
  } = useRepositorioDigital();

  const getIconoArchivo = (tipo: string) => {
    const ext = tipo?.toUpperCase();
    if (ext === 'PDF') return <i className="bi bi-file-earmark-pdf-fill text-danger fs-3"></i>;
    if (ext === 'DOCX' || ext === 'DOC') return <i className="bi bi-file-earmark-word-fill text-primary fs-3"></i>;
    if (ext === 'JPG' || ext === 'PNG' || ext === 'JPEG') return <i className="bi bi-file-earmark-image-fill text-warning fs-3"></i>;
    return <i className="bi bi-file-earmark-text-fill text-secondary fs-3"></i>;
  };

  return (
    <div className={`container-fluid p-3 font-monospace ${textColor}`} style={{ backgroundColor: pageBg, minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Repositorio Digital</h2>
        <i className="bi bi-question-circle text-info fs-4" style={{ cursor: 'pointer' }}></i>
      </div>

      <div className="row g-3">
        {/* PANEL IZQUIERDO */}
        <div className="col-lg-7">
          <div className="card p-3 rounded-3" style={{ backgroundColor: cardBg, borderColor: cardBorder, color: 'inherit' }}>
            <FiltrosRepositorio
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              filtroMateria={filtroMateria}
              setFiltroMateria={setFiltroMateria}
              filtroInstitucion={filtroInstitucion}
              setFiltroInstitucion={setFiltroInstitucion}
              areas={areas}
              instituciones={instituciones}
              onAgregarDocumento={() => setModalAgregar(true)}
              textColor={textColor}
              inputBg={inputBg}
              cardBorder={cardBorder}
            />
            <TablaDocumentos
              documentos={documentosFiltrados}
              cargando={cargando}
              documentoSeleccionado={documentoSeleccionado}
              onSelectDocumento={setDocumentoSeleccionado}
              onEliminar={handleEliminar}
              getIconoArchivo={getIconoArchivo}
              isDarkMode={isDarkMode}
              cardBg={cardBg}
              cardBorder={cardBorder}
            />
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="col-lg-5">
          <DetalleDocumento
            documento={documentoSeleccionado}
            getIconoArchivo={getIconoArchivo}
            onPrevisualizar={() => setModalPrevisualizar(true)}
            isDarkMode={isDarkMode}
            cardBg={cardBg}
            cardBorder={cardBorder}
          />
        </div>
      </div>

      {/* MODALES */}
      <ModalAgregarDocumento 
        show={modalAgregar}
        areas={areas}
        guardando={guardando}
        onClose={() => setModalAgregar(false)}
        onGuardar={handleGuardarNuevo}
        onAbrirNuevaArea={() => setModalNuevaArea(true)}
        onAbrirNuevaInst={() => setModalNuevaInst(true)}
      />

      <ModalCrearInstitucion
        show={modalNuevaInst}
        onClose={() => setModalNuevaInst(false)}
        onSubmit={handleCrearInstitucionRapida}
        nombre={nombreInstNueva}
        setNombre={setNombreInstNueva}
        tipo={tipoInstNueva}
        setTipo={setTipoInstNueva}
        textColor={textColor}
        cardBg={cardBg}
        inputBg={inputBg}
        cardBorder={cardBorder}
        isDarkMode={isDarkMode}
      />

      <ModalCrearArea
        show={modalNuevaArea}
        onClose={() => setModalNuevaArea(false)}
        onSubmit={handleCrearAreaRapida}
        instituciones={instituciones}
        idInst={idInstParaArea}
        setIdInst={setIdInstParaArea}
        nombre={nombreAreaNueva}
        setNombre={setNombreAreaNueva}
        textColor={textColor}
        cardBg={cardBg}
        inputBg={inputBg}
        cardBorder={cardBorder}
        isDarkMode={isDarkMode}
      />

      <ModalPrevisualizar
        show={modalPrevisualizar}
        documento={documentoSeleccionado}
        onClose={() => setModalPrevisualizar(false)}
        textColor={textColor}
        cardBg={cardBg}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};