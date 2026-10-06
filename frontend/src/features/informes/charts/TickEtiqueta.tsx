import React from 'react';
import { partirEtiqueta } from './etiquetasEje';

interface Props {
  x?: number;
  y?: number;
  payload?: { value: unknown };
  fill?: string;
}

// Tick del eje X en hasta 2 líneas (ver etiquetasEje.ts).
export const TickEtiqueta: React.FC<Props> = ({ x = 0, y = 0, payload, fill = '#a1a1aa' }) => {
  const lineas = partirEtiqueta(payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{String(payload?.value ?? '')}</title>
      <text textAnchor="middle" fill={fill} fontSize={12}>
        {lineas.map((linea, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 14 : 14}>{linea}</tspan>
        ))}
      </text>
    </g>
  );
};
