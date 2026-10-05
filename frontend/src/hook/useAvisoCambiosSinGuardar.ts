import { useEffect } from 'react';
import { confirmarAccion } from '../config/dialogStore';

// Aviso de "trabajo sin terminar" (ej. un carrito cargado en Crear Pedido o Venta Rápida).
// Antes, tocar cualquier opción del menú borraba todo sin preguntar.
// El router de la app (BrowserRouter) no permite bloquear la navegación, así que la pantalla
// avisa acá que tiene cambios y el menú lateral pregunta antes de salir. Al cerrar o recargar
// la pestaña, avisa el propio navegador.

let mensajePendiente: string | null = null;

export const useAvisoCambiosSinGuardar = (activo: boolean, mensaje: string) => {
  useEffect(() => {
    if (!activo) return;
    mensajePendiente = mensaje;
    const alCerrar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', alCerrar);
    return () => {
      if (mensajePendiente === mensaje) mensajePendiente = null;
      window.removeEventListener('beforeunload', alCerrar);
    };
  }, [activo, mensaje]);
};

/** Devuelve true si se puede salir de la pantalla actual (no hay nada pendiente o el usuario confirmó). */
export const puedeSalirDeLaPantalla = async (): Promise<boolean> => {
  if (!mensajePendiente) return true;
  const salir = await confirmarAccion(mensajePendiente, {
    titulo: 'Hay cambios sin guardar',
    textoConfirmar: 'Salir igual',
    textoCancelar: 'Quedarme',
  });
  if (salir) mensajePendiente = null;
  return salir;
};
