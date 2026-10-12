type Listener = () => void;
type Snapshot = { visible: boolean; mensaje: string };

let activeCount = 0;
let mensajeActual = 'Procesando...';
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

let snapshotActual: Snapshot = { visible: false, mensaje: mensajeActual };

const actualizarSnapshot = () => {
  const nuevoVisible = activeCount > 0;
  if (
    nuevoVisible !== snapshotActual.visible ||
    mensajeActual !== snapshotActual.mensaje
  ) {
    snapshotActual = { visible: nuevoVisible, mensaje: mensajeActual };
  }
};

const emitir = () => {
  actualizarSnapshot();
  listeners.forEach((l) => l());
};

export const loadingStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Snapshot {
    return snapshotActual;
  },
};

export const showLoading = (mensaje = 'Procesando...') => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  mensajeActual = mensaje;
  activeCount += 1;
  emitir();
};

export const hideLoading = () => {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    hideTimeout = setTimeout(() => {
      mensajeActual = 'Procesando...';
      emitir();
    }, 120);
  } else {
    emitir();
  }
};
// Cambia el texto de la pantalla de carga que ya está visible (ej. cuando una espera se alarga).
export const actualizarMensajeLoading = (mensaje: string) => {
  if (activeCount === 0) return;
  mensajeActual = mensaje;
  emitir();
};

// Muestra la pantalla de carga mientras corre `tarea`. Si tarda más de unos segundos, avisa que
// el servidor se está despertando: en el plan gratis de Render se apaga tras un rato sin uso y el
// primer pedido puede tardar hasta un minuto.
export const conCargaDeArranque = async <T,>(mensaje: string, tarea: () => Promise<T>): Promise<T> => {
  showLoading(mensaje);
  const aviso = setTimeout(
    () => actualizarMensajeLoading('El servidor se está iniciando, puede tardar hasta un minuto...'),
    4000
  );
  try {
    return await tarea();
  } finally {
    clearTimeout(aviso);
    hideLoading();
  }
};
