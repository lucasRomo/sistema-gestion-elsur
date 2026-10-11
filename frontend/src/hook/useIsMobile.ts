import { useState, useEffect } from "react";

/**
 * Vista para celular: pantallas angostas (< breakpoint) o celulares acostados. En el celular
 * el sistema muestra solo lo que el administrador consulta (Informes, Máquinas,
 * Notificaciones, Ajustes); no tiene operaciones de mostrador. Una tablet en vertical
 * (768 px o más) usa la vista completa.
 */
export const esPantallaMovil = (breakpoint = 768): boolean => {
  const isSmallWidth = window.innerWidth < breakpoint;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const esCelularAcostado = isTouchDevice && Math.min(window.innerWidth, window.innerHeight) < 500;
  return isSmallWidth || esCelularAcostado;
};

// Hubo un botón "Versión completa" que forzaba la vista de escritorio en el celular (y se
// veía rota). Se quitó: si alguien lo había activado, se limpia para que vuelva a la vista móvil.
try {
  localStorage.removeItem("vista_completa_forzada");
} catch {
  // sin almacenamiento: no hay nada que limpiar
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => esPantallaMovil(breakpoint));

  useEffect(() => {
    const handleResize = () => setIsMobile(esPantallaMovil(breakpoint));

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
