// Color e ícono por estado del pedido (compartido por EstadoBadge y el tablero del taller).
// Antes todos se mostraban con el mismo badge gris y había que leer la palabra.
export interface EstiloEstado {
  icono: string;
  etiqueta: string;
  claro: { bg: string; color: string; borde: string };
  oscuro: { bg: string; color: string; borde: string };
}

export const ESTILOS: Record<string, EstiloEstado> = {
  PENDIENTE: { icono: 'bi-clock', etiqueta: 'Pendiente',
    claro: { bg: '#fef3c7', color: '#92400e', borde: '#fcd34d' }, oscuro: { bg: 'rgba(234,179,8,0.15)', color: '#fde047', borde: '#a16207' } },
  'EN PROCESO': { icono: 'bi-gear-wide-connected', etiqueta: 'En proceso',
    claro: { bg: '#dbeafe', color: '#1e40af', borde: '#93c5fd' }, oscuro: { bg: 'rgba(59,130,246,0.18)', color: '#93c5fd', borde: '#1d4ed8' } },
  PAUSADO: { icono: 'bi-pause-circle', etiqueta: 'Pausado',
    claro: { bg: '#f1f5f9', color: '#475569', borde: '#cbd5e1' }, oscuro: { bg: 'rgba(148,163,184,0.15)', color: '#cbd5e1', borde: '#475569' } },
  FINALIZADO: { icono: 'bi-check2-circle', etiqueta: 'Finalizado',
    claro: { bg: '#dcfce7', color: '#166534', borde: '#86efac' }, oscuro: { bg: 'rgba(34,197,94,0.15)', color: '#86efac', borde: '#15803d' } },
  ENTREGADO: { icono: 'bi-box-seam', etiqueta: 'Entregado',
    claro: { bg: '#d1fae5', color: '#065f46', borde: '#6ee7b7' }, oscuro: { bg: 'rgba(16,185,129,0.18)', color: '#6ee7b7', borde: '#047857' } },
  PRESUPUESTO: { icono: 'bi-file-earmark-text', etiqueta: 'Presupuesto',
    claro: { bg: '#f3e8ff', color: '#6b21a8', borde: '#d8b4fe' }, oscuro: { bg: 'rgba(142,69,224,0.2)', color: '#d8b4fe', borde: '#8e45e0' } },
  CANCELADO: { icono: 'bi-x-circle', etiqueta: 'Cancelado',
    claro: { bg: '#fee2e2', color: '#991b1b', borde: '#fca5a5' }, oscuro: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', borde: '#b91c1c' } },
  DEVUELTO: { icono: 'bi-arrow-return-left', etiqueta: 'Devuelto',
    claro: { bg: '#ffedd5', color: '#9a3412', borde: '#fdba74' }, oscuro: { bg: 'rgba(249,115,22,0.15)', color: '#fdba74', borde: '#c2410c' } },
  VENTA_RAPIDA: { icono: 'bi-lightning-charge', etiqueta: 'Venta rápida',
    claro: { bg: '#ccfbf1', color: '#115e59', borde: '#5eead4' }, oscuro: { bg: 'rgba(20,184,166,0.15)', color: '#5eead4', borde: '#0f766e' } },
};

export const colorEstado = (estado: string | undefined, isDark: boolean) => {
  const estilo = ESTILOS[(estado || '').toUpperCase()];
  return estilo ? (isDark ? estilo.oscuro : estilo.claro).color : (isDark ? '#a1a1aa' : '#64748b');
};

