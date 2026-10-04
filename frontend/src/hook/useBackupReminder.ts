import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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

// Pantallas previas al inicio de sesión: el aviso nunca se muestra ahí.
const RUTAS_PUBLICAS = ['/', '/login', '/registro'];

// Fecha local (no UTC): con toISOString() un viernes a la noche en Argentina ya figuraba como sábado.
const fechaLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const useBackupReminder = () => {
  const [mostrar, setMostrar] = useState(false);
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  // Se reevalúa en cada cambio de ruta: antes se chequeaba una sola vez al cargar la app, así
  // que aparecía en la bienvenida (si había quedado una sesión vieja guardada) y no después de
  // iniciar sesión, porque el login no recarga la página.
  useEffect(() => {
    if (isMobile || RUTAS_PUBLICAS.includes(pathname)) {
      setMostrar(false);
      return;
    }

    const usuario = obtenerUsuarioLogueado();
    const esAdmin = usuario?.rol?.nombreRol?.toUpperCase() === 'ADMIN';
    if (!esAdmin) return;

    const hoy = new Date();
    if (!esViernes(hoy)) return;

    const hoyStr = fechaLocal(hoy);
    const ultimaVez = localStorage.getItem(CLAVE_ULTIMO_RECORDATORIO);
    if (ultimaVez === hoyStr) return; 

    setMostrar(true);
  }, [isMobile, pathname]);

  const marcarComoVisto = useCallback(() => {
    const hoyStr = fechaLocal(new Date());
    localStorage.setItem(CLAVE_ULTIMO_RECORDATORIO, hoyStr);
    setMostrar(false);
  }, []);

  return { mostrar, marcarComoVisto };
};