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

const esViernes = (fecha: Date) => fecha.getDay() === 5; // 0=domingo, 5=viernes

export const useBackupReminder = () => {
  const [mostrar, setMostrar] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return; // en celular no existe la función de respaldo, no se muestra

    const usuario = obtenerUsuarioLogueado();
    const esAdmin = usuario?.rol?.nombreRol?.toUpperCase() === 'ADMIN';
    if (!esAdmin) return;

    const hoy = new Date();
    if (!esViernes(hoy)) return;

    const hoyStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
    const ultimaVez = localStorage.getItem(CLAVE_ULTIMO_RECORDATORIO);
    if (ultimaVez === hoyStr) return; // ya se mostró hoy

    setMostrar(true);
  }, [isMobile]);

  const marcarComoVisto = useCallback(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(CLAVE_ULTIMO_RECORDATORIO, hoyStr);
    setMostrar(false);
  }, []);

  return { mostrar, marcarComoVisto };
};