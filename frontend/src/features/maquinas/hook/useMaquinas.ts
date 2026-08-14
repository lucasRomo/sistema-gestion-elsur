import { useState, useEffect } from 'react';
import type { Maquina } from '../types/Maquina';
import { 
  fetchMaquinas, 
  guardarMaquinaAPI, 
  reportarFallaAPI, 
  eliminarMaquinaAPI 
} from '../service/maquinasService';

export const useMaquinas = () => {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Modales
  const [showModalCrud, setShowModalCrud] = useState(false);
  const [maquinaAEditar, setMaquinaAEditar] = useState<Maquina | null>(null);

  const [showModalFalla, setShowModalFalla] = useState(false);

  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [maquinaHistorial, setMaquinaHistorial] = useState<Maquina | null>(null);

  const cargarMaquinas = async () => {
    setCargando(true);
    try {
      const data = await fetchMaquinas();
      setMaquinas(data);
    } catch (err) {
      console.error('Error al cargar máquinas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  const handleGuardarMaquina = async (maquina: Maquina & { observacion?: string }) => {
    await guardarMaquinaAPI(maquina);
    await cargarMaquinas();
  };

  const handleReportarFalla = async (idMaquina: number, descripcion: string, prioridad: string) => {
    await reportarFallaAPI(idMaquina, descripcion, prioridad);
    await cargarMaquinas();
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Seguro que desea eliminar esta máquina?')) return;
    try {
      await eliminarMaquinaAPI(id);
      await cargarMaquinas();
    } catch (err) {
      console.error(err);
    }
  };

  const maquinasFiltradas = maquinas.filter(m =>
    m.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    m.estado.toLowerCase().includes(filtro.toLowerCase())
  );

  return {
    maquinas,
    maquinasFiltradas,
    cargando,
    filtro,
    setFiltro,
    showModalCrud,
    setShowModalCrud,
    maquinaAEditar,
    setMaquinaAEditar,
    showModalFalla,
    setShowModalFalla,
    showModalHistorial,
    setShowModalHistorial,
    maquinaHistorial,
    setMaquinaHistorial,
    cargarMaquinas,
    handleGuardarMaquina,
    handleReportarFalla,
    handleEliminar
  };
};