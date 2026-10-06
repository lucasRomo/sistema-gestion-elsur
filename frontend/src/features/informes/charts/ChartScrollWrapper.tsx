import React from 'react';
import { anchoPorEtiquetas } from './etiquetasEje';

interface ChartScrollWrapperProps {
  cantidadItems: number;
  anchoPorItem: number;
  height: string | number;
  /** Nombres del eje X: si se pasan, cada barra se ensancha lo necesario para que no se pisen. */
  etiquetas?: unknown[];
  children: React.ReactNode;
}

export const ChartScrollWrapper: React.FC<ChartScrollWrapperProps> = ({
  cantidadItems,
  anchoPorItem,
  height,
  etiquetas,
  children
}) => {
  const ancho = etiquetas && etiquetas.length > 0 ? anchoPorEtiquetas(etiquetas, anchoPorItem) : anchoPorItem;
  const minWidth = cantidadItems * ancho;

  return (
    <div
      className="im-chart-scroll"
      tabIndex={-1}
      style={{ width: '100%', height, overflowX: 'auto', overflowY: 'hidden' }}
    >
      <div style={{ width: `${minWidth}px`, height: '100%', minWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
};
