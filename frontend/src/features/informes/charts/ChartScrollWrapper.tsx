// ChartScrollWrapper.tsx
import React from 'react';

interface ChartScrollWrapperProps {
  cantidadItems: number;
  anchoPorItem: number;
  height: string | number;
  children: React.ReactNode;
}

export const ChartScrollWrapper: React.FC<ChartScrollWrapperProps> = ({
  cantidadItems,
  anchoPorItem,
  height,
  children
}) => {
  // Calculamos el ancho total requerido en base a la cantidad de elementos
  const minWidth = cantidadItems * anchoPorItem;

  return (
    <div 
      className="im-chart-scroll" 
      style={{ width: '100%', height, overflowX: 'auto', overflowY: 'hidden' }}
    >
      <div style={{ width: `${minWidth}px`, height: '100%', minWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
};