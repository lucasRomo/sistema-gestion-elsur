// Avisos breves (toasts) para acciones chicas y reversibles: aparecen abajo a la derecha y se
// van solos, sin bloquear la pantalla ni pedir un clic extra. Para lo importante (cobros,
// cierres de caja, eliminar) se siguen usando los modales.

type Listener = () => void;

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
  accion?: { texto: string; onClick: () => void };
}

const DURACION_MS = 4500;

let siguienteId = 1;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();
const emitir = () => listeners.forEach((l) => l());

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Toast[] {
    return toasts;
  },
  cerrar(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
    emitir();
  },
};

export const mostrarToast = (
  mensaje: string,
  opciones: { tipo?: TipoToast; accion?: Toast['accion'] } = {}
) => {
  const id = siguienteId++;
  toasts = [...toasts.slice(-3), { id, mensaje, tipo: opciones.tipo ?? 'exito', accion: opciones.accion }];
  emitir();
  setTimeout(() => toastStore.cerrar(id), opciones.accion ? DURACION_MS + 2000 : DURACION_MS);
};
