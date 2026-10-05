import React from 'react';
import type { DireccionOrden } from '../../hook/useOrdenTabla';

interface Props extends React.ThHTMLAttributes<HTMLTableCellElement> {
  clave: string;
  orden: { clave: string; direccion: DireccionOrden };
  onOrdenar: (clave: string) => void;
}

// Encabezado de tabla clickeable que muestra hacia dónde está ordenada la columna.
export const ThOrdenable: React.FC<Props> = ({ clave, orden, onOrdenar, children, style, ...resto }) => {
  const activa = orden.clave === clave;
  const icono = !activa ? 'bi-arrow-down-up' : orden.direccion === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  return (
    <th
      {...resto}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
      onClick={() => onOrdenar(clave)}
      aria-sort={activa ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
      title="Ordenar por esta columna"
    >
      {children}
      <i className={`bi ${icono} ms-1`} style={{ opacity: activa ? 1 : 0.35, fontSize: '0.75rem' }} aria-hidden="true"></i>
    </th>
  );
};
