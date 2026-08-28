import { useState, useEffect, useMemo } from 'react';
import { repositorioService } from '../services/repositorioService';
import type { DocumentoDigital, AreaCurso, Institucion } from '../types/Repositorio';

export const useRepositorioDigital = () => {
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
  const [modalNuevaInst, setModalNuevaInst] = useState<boolean>(false);
  const [modalNuevaArea, setModalNuevaArea] = useState<boolean>(false);

  // Modales Personalizados de Eliminar
  const [idAEliminar, setIdAEliminar] = useState<number | null>(null);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState<boolean>(false);
  const [mostrarExitoEliminar, setMostrarExitoEliminar] = useState<boolean>(false);

  const [guardando, setGuardando] = useState(false);

  // Formulario Institución Rápida
  const [nombreInstNueva, setNombreInstNueva] = useState('');
  const [tipoInstNueva, setTipoInstNueva] = useState('Universidad');

  // Formulario Cátedra Rápida
  const [nombreAreaNueva, setNombreAreaNueva] = useState('');
  const [idInstParaArea, setIdInstParaArea] = useState('');

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

  useEffect(() => {
    cargarDatos();
  }, []);

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

  // Manejo de Eliminación Lógica con Modal Personalizado
  const solicitarEliminar = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIdAEliminar(id);
    setMostrarConfirmarEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!idAEliminar) return;
    try {
      await repositorioService.eliminarDocumento(idAEliminar);
      const listaNueva = documentos.filter((d) => d.idDocumento !== idAEliminar);
      setDocumentos(listaNueva);
      if (documentoSeleccionado?.idDocumento === idAEliminar) {
        setDocumentoSeleccionado(listaNueva[0] || null);
      }
      setMostrarConfirmarEliminar(false);
      setMostrarExitoEliminar(true);
    } catch (err) {
      console.error(err);
      setMostrarConfirmarEliminar(false);
    } finally {
      setIdAEliminar(null);
    }
  };

  const handleGuardarNuevo = async (formData: FormData) => {
    try {
      setGuardando(true);
      const nuevoDoc = await repositorioService.subirDocumento(formData);
      setDocumentos([nuevoDoc, ...documentos]);
      setDocumentoSeleccionado(nuevoDoc);
    } catch (err) {
      console.error('Error al registrar el archivo:', err);
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  // Reseteo de Formularios al Cerrar/Cancelar
  const cerrarModalNuevaInst = () => {
    setNombreInstNueva('');
    setTipoInstNueva('Universidad');
    setModalNuevaInst(false);
  };

  const cerrarModalNuevaArea = () => {
    setNombreAreaNueva('');
    setIdInstParaArea('');
    setModalNuevaArea(false);
  };

  const handleCrearInstitucionRapida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreInstNueva.trim()) return;

    try {
      const nueva = await repositorioService.crearInstitucion(nombreInstNueva, tipoInstNueva);
      setInstituciones((prev) => [...prev, nueva]);
      // ❌ SE QUITÓ: cerrarModalNuevaInst();
    } catch (err) {
      console.error('Error al crear institución:', err);
      throw err;
    }
  };

  const handleCrearAreaRapida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreAreaNueva.trim() || !idInstParaArea) return;

    try {
      const nuevaArea = await repositorioService.crearArea(nombreAreaNueva, parseInt(idInstParaArea));
      const instEncontrada = instituciones.find((i) => i.idInstitucion === parseInt(idInstParaArea));

      const areaCompleta: AreaCurso = {
        ...nuevaArea,
        institucion: (nuevaArea.institucion && nuevaArea.institucion.nombreInstitucion)
          ? nuevaArea.institucion
          : (instEncontrada || nuevaArea.institucion)
      };

      setAreas((prev) => [...prev, areaCompleta]);
      // ❌ SE QUITÓ: cerrarModalNuevaArea();
    } catch (err) {
      console.error('Error al crear área:', err);
      throw err;
    }
  };

  return {
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
    cerrarModalNuevaInst,
    cerrarModalNuevaArea,
    solicitarEliminar,
    confirmarEliminar,
    mostrarConfirmarEliminar,
    setMostrarConfirmarEliminar,
    mostrarExitoEliminar,
    setMostrarExitoEliminar,
    handleGuardarNuevo,
    handleCrearInstitucionRapida,
    handleCrearAreaRapida,
  };
};