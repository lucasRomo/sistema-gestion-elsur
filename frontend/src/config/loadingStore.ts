type Listener = () => void;
type Snapshot = { visible: boolean; mensaje: string };

let activeCount = 0;
let mensajeActual = 'Procesando...';
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

// Snapshot cacheado: solo se reemplaza cuando cambian los valores reales
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