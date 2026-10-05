import { useState, useEffect } from "react";

const CLAVE_VISTA_COMPLETA = "vista_completa_forzada";
const EVENTO_CAMBIO_VISTA = "cambio-vista-completa";

/**
 * Pantalla de celular según el tamaño, sin tener en cuenta la preferencia del usuario.
 * Antes, cualquier pantalla táctil en vertical (ej. una tablet en el mostrador) entraba en la
 * vista móvil, que solo tiene Informes, Máquinas, Notificaciones y Ajustes: no se podía vender.
 * Ahora la vista móvil es para pantallas angostas (< breakpoint) o celulares acostados.
 */
export const esPantallaMovil = (breakpoint = 768): boolean => {
  const isSmallWidth = window.innerWidth < breakpoint;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const esCelularAcostado = isTouchDevice && Math.min(window.innerWidth, window.innerHeight) < 500;
  return isSmallWidth || esCelularAcostado;
};

export const vistaCompletaForzada = (): boolean => {
  try {
    return localStorage.getItem(CLAVE_VISTA_COMPLETA) === "1";
  } catch {
    return false;
  }
};

/** Botón "Ver versión completa" / "Volver a la vista móvil". */
export const forzarVistaCompleta = (activar: boolean) => {
  try {
    if (activar) localStorage.setItem(CLAVE_VISTA_COMPLETA, "1");
    else localStorage.removeItem(CLAVE_VISTA_COMPLETA);
  } catch {
    // sin almacenamiento: el cambio dura hasta recargar
  }
  window.dispatchEvent(new Event(EVENTO_CAMBIO_VISTA));
};

export function useIsMobile(breakpoint = 768) {
  const checkIsMobile = () => esPantallaMovil(breakpoint) && !vistaCompletaForzada();

  const [isMobile, setIsMobile] = useState(checkIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.addEventListener(EVENTO_CAMBIO_VISTA, handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener(EVENTO_CAMBIO_VISTA, handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
