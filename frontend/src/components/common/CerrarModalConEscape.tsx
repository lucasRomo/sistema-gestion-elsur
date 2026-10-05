import { useEffect } from 'react';
import { loadingStore } from '../../config/loadingStore';

// Esc cierra el modal que está arriba de todo, en todo el sistema. Los modales de la app son
// <div class="modal d-block"> armados a mano (sin el JS de Bootstrap), así que ninguno lo
// hacía. En vez de tocar cada uno, se busca el de mayor z-index y se "aprieta" su botón de
// cerrar: la X, o si no tiene, Cerrar / Cancelar / Volver. Así pasa por la misma lógica (y las
// mismas confirmaciones) que el clic.

const TEXTOS_CERRAR = ['cerrar', 'cancelar', 'volver', 'no, volver'];

const modalSuperior = (): HTMLElement | null => {
  const abiertos = Array.from(document.querySelectorAll<HTMLElement>('.modal.d-block, .modal.show'))
    .filter((m) => m.getClientRects().length > 0);
  if (abiertos.length === 0) return null;
  // Mayor z-index; a igual z-index, el último en el DOM (se montó después).
  return abiertos.reduce((arriba, m) => {
    const zArriba = Number(getComputedStyle(arriba).zIndex) || 0;
    const zM = Number(getComputedStyle(m).zIndex) || 0;
    return zM >= zArriba ? m : arriba;
  });
};

const botonCerrar = (modal: HTMLElement): HTMLButtonElement | null => {
  const x = modal.querySelector<HTMLButtonElement>('button.btn-close');
  if (x) return x;
  const botones = Array.from(modal.querySelectorAll<HTMLButtonElement>('button'));
  return botones.find((b) => TEXTOS_CERRAR.includes((b.textContent || '').trim().toLowerCase())) ?? null;
};

export const CerrarModalConEscape: React.FC = () => {
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // Mientras hay una pantalla de carga no se cierra nada (hay una operación en curso).
      if (loadingStore.getSnapshot().visible) return;
      const modal = modalSuperior();
      if (!modal) return;
      const boton = botonCerrar(modal);
      if (!boton || boton.disabled) return;
      e.preventDefault();
      boton.click();
    };
    // En captura: corre antes que otros atajos (ej. Esc de Venta Rápida) y les avisa con
    // preventDefault que la tecla ya se usó para cerrar un modal.
    document.addEventListener('keydown', manejar, true);
    return () => document.removeEventListener('keydown', manejar, true);
  }, []);

  return null;
};
