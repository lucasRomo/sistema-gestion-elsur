import { useState, useEffect } from 'react';
import type { RegistroActividad } from '../types/RegistroActividad';
import { getRegistrosActividad } from '../services/registroActividadServices';

export const useHistorialActividad = () => {
  const [actividades, setActividades] = useState<RegistroActividad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarActividades = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getRegistrosActividad();
      setActividades(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos del historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  return { actividades, cargando, error, recargar: cargarActividades };
};