// Reemplazo de alert()/confirm() nativos del navegador por modales con el estilo
// de la app. Mismo patrón que loadingStore: un store global + un único
// <DialogHost /> montado en App.tsx.

type Listener = () => void;

export type TipoDialogo = 'aviso' | 'error' | 'exito' | 'confirmar';

export interface Dialogo {
  id: number;
  tipo: TipoDialogo;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar: string;
  resolver: (valor: boolean) => void;
}

interface OpcionesDialogo {
  titulo?: string;
  tipo?: Exclude<TipoDialogo, 'confirmar'>;
}

interface OpcionesConfirmacion {
  titulo?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
}

const TITULOS_POR_DEFECTO: Record<TipoDialogo, string> = {
  aviso: '¡Atención!',
  error: 'Ocurrió un error',
  exito: '¡Éxito!',
  confirmar: 'Confirmar acción',
};

let siguienteId = 1;
let cola: Dialogo[] = [];
const listeners = new Set<Listener>();

const emitir = () => listeners.forEach((l) => l());

const encolar = (dialogo: Omit<Dialogo, 'id' | 'resolver'>): Promise<boolean> =>
  new Promise((resolve) => {
    cola = [...cola, { ...dialogo, id: siguienteId++, resolver: resolve }];
    emitir();
  });

export const dialogStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Dialogo | null {
    return cola[0] ?? null;
  },
  cerrar(id: number, valor: boolean) {
    const dialogo = cola.find((d) => d.id === id);
    cola = cola.filter((d) => d.id !== id);
    emitir();
    dialogo?.resolver(valor);
  },
};

/** Muestra un aviso con el estilo de la app. Devuelve una promesa que se resuelve al cerrarlo. */
export const mostrarAviso = (mensaje: string, opciones: OpcionesDialogo = {}): Promise<void> => {
  const tipo = opciones.tipo ?? 'aviso';
  return encolar({
    tipo,
    titulo: opciones.titulo ?? TITULOS_POR_DEFECTO[tipo],
    mensaje,
    textoConfirmar: 'Cerrar',
    textoCancelar: '',
  }).then(() => undefined);
};

export const mostrarError = (mensaje: string, titulo?: string) =>
  mostrarAviso(mensaje, { tipo: 'error', titulo });

/** Reemplazo de window.confirm(): resuelve true si el usuario confirma. */
export const confirmarAccion = (mensaje: string, opciones: OpcionesConfirmacion = {}): Promise<boolean> =>
  encolar({
    tipo: 'confirmar',
    titulo: opciones.titulo ?? TITULOS_POR_DEFECTO.confirmar,
    mensaje,
    textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
    textoCancelar: opciones.textoCancelar ?? 'Cancelar',
  });
