import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '../hook/useIsMobile';

const CLAVE_ULTIMO_RECORDATORIO = 'ultimo_recordatorio_backup';

const obtenerUsuarioLogueado = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario_logueado') || 'null');
  } catch {
    return null;
  }
};

const esViernes = (fecha: Date) => fecha.getDay() === 5; 

export const useBackupReminder = () => {
  const [mostrar, setMostrar] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return; 

    const usuario = obtenerUsuarioLogueado();
    const esAdmin = usuario?.rol?.nombreRol?.toUpperCase() === 'ADMIN';
    if (!esAdmin) return;

    const hoy = new Date();
    if (!esViernes(hoy)) return;

    const hoyStr = hoy.toISOString().split('T')[0]; 
    const ultimaVez = localStorage.getItem(CLAVE_ULTIMO_RECORDATORIO);
    if (ultimaVez === hoyStr) return; 

    setMostrar(true);
  }, [isMobile]);

  const marcarComoVisto = useCallback(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(CLAVE_ULTIMO_RECORDATORIO, hoyStr);
    setMostrar(false);
  }, []);

  return { mostrar, marcarComoVisto };
};