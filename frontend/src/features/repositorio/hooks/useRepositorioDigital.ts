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

  // Estados de Modales
  const [modalAgregar, setModalAgregar] = useState<boolean>(false);
  const [modalPrevisualizar, setModalPrevisualizar] = useState<boolean>(false);
  const [modalNuevaInst, setModalNuevaInst] = useState<boolean>(false);
  const [modalNuevaArea, setModalNuevaArea] = useState<boolean>(false);

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

  const handleGuardarNuevo = async (formData: FormData) => {
    try {
      setGuardando(true);
      const nuevoDoc = await repositorioService.subirDocumento(formData);
      setDocumentos([nuevoDoc, ...documentos]);
      setDocumentoSeleccionado(nuevoDoc);
    } catch (err) {
      alert('Error al registrar el archivo en el repositorio.');
      throw err;
    } finally {
      setGuardando(false);
    }};

  const handleCrearInstitucionRapida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreInstNueva.trim()) return;

    try {
      const nueva = await repositorioService.crearInstitucion(nombreInstNueva, tipoInstNueva);
      setInstituciones([...instituciones, nueva]);
      setNombreInstNueva('');
    } catch (err) {
      alert('Error al crear la institución.');
      throw err;
    }
  };

  const handleCrearAreaRapida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombreAreaNueva.trim() || !idInstParaArea) {
      alert('Seleccione la institución y el nombre de la cátedra/materia.');
      return;
    }

    try {
      const nuevaArea = await repositorioService.crearArea(nombreAreaNueva, parseInt(idInstParaArea));
      setAreas([...areas, nuevaArea]);
      setNombreAreaNueva('');
      setIdInstParaArea('');
    } catch (err) {
      alert('Error al crear la cátedra/materia.');
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
    handleEliminar,
    handleGuardarNuevo,
    handleCrearInstitucionRapida,
    handleCrearAreaRapida,
  };
};