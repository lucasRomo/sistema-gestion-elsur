import { useState, useEffect, useCallback, useRef } from 'react';
import type { RegistroActividad } from '../types/RegistroActividad';
import {
  getRegistrosActividadPaginado,
  getUsuariosConActividad,
  type UsuarioConActividad,
} from '../services/registroActividadServices';

const TAMANO_PAGINA = 50;

// El registro crece con cada cambio que hace cualquiera: antes se traía entero en cada
// apertura. Ahora se pide de a páginas y los filtros (tabla y usuario) los resuelve el backend.
export const useHistorialActividad = (tabla: string, idUsuario: number | null) => {
  const [actividades, setActividades] = useState<RegistroActividad[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioConActividad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoMas, setCargandoMas] = useState<boolean>(false);
  const [pagina, setPagina] = useState<number>(0);
  const [hayMas, setHayMas] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const peticionActual = useRef(0);

  const cargarActividades = useCallback(async () => {
    const id = ++peticionActual.current;
    setCargando(true);
    setError(null);
    try {
      const data = await getRegistrosActividadPaginado({ tabla, idUsuario, pagina: 0, tamano: TAMANO_PAGINA });
      if (id !== peticionActual.current) return; // llegó un filtro más nuevo
      setActividades(data.contenido ?? []);
      setPagina(0);
      setHayMas(!data.ultima);
      setTotal(data.totalElementos ?? 0);
    } catch (err) {
      console.error(err);
      if (id === peticionActual.current) setError('Error al cargar los datos del historial.');
    } finally {
      if (id === peticionActual.current) setCargando(false);
    }
  }, [tabla, idUsuario]);

  const cargarMas = async () => {
    if (cargandoMas || !hayMas) return;
    setCargandoMas(true);
    try {
      const data = await getRegistrosActividadPaginado({ tabla, idUsuario, pagina: pagina + 1, tamano: TAMANO_PAGINA });
      setActividades(prev => [...prev, ...(data.contenido ?? [])]);
      setPagina(pagina + 1);
      setHayMas(!data.ultima);
      setTotal(data.totalElementos ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoMas(false);
    }
  };

  useEffect(() => {
    getUsuariosConActividad().then(setUsuarios).catch(err => console.error(err));
  }, []);

  // Espera a que el usuario deje de escribir antes de buscar.
  useEffect(() => {
    const t = setTimeout(cargarActividades, tabla ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargarActividades, tabla]);

  return { actividades, usuarios, cargando, cargandoMas, hayMas, total, cargarMas, error, recargar: cargarActividades };
};
