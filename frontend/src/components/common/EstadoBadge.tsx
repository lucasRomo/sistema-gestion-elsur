import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

import { ESTILOS } from './estadoPedido';

interface Props {
  estado: string | undefined;
  tamano?: 'sm' | 'md';
}

export const EstadoBadge: React.FC<Props> = ({ estado, tamano = 'md' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const clave = (estado || '').toUpperCase();
  const estilo = ESTILOS[clave];
  const colores = estilo ? (isDark ? estilo.oscuro : estilo.claro) : (isDark ? ESTILOS.PAUSADO.oscuro : ESTILOS.PAUSADO.claro);

  return (
    <span
      className="d-inline-flex align-items-center gap-1 fw-semibold font-monospace rounded-pill"
      style={{
        backgroundColor: colores.bg,
        color: colores.color,
        border: `1px solid ${colores.borde}`,
        padding: tamano === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: tamano === 'sm' ? '0.72rem' : '0.8rem',
        whiteSpace: 'nowrap'
      }}
    >
      <i className={`bi ${estilo?.icono ?? 'bi-circle'}`} aria-hidden="true"></i>
      {estilo?.etiqueta ?? estado ?? '-'}
    </span>
  );
};
