import React from 'react';
import { useIsMobile } from '../../hook/useIsMobile';

// Cartelito fijo que avisa que es la demo: no tapa nada (no recibe clics). En el celular va abajo,
// arriba de la barra de pestañas, para no pisar el título de la pantalla.
export const CartelDemo: React.FC = () => {
  const isMobile = useIsMobile();
  const posicion: React.CSSProperties = isMobile
    ? { bottom: 'calc(78px + env(safe-area-inset-bottom))', right: 10 }
    : { top: 6, left: '50%', transform: 'translateX(-50%)' };

  return (
    <div
      className="font-monospace"
      style={{
        position: 'fixed',
        ...posicion,
        zIndex: 2000,
        pointerEvents: 'none',
        backgroundColor: 'rgba(142, 69, 224, 0.92)',
        color: '#ffffff',
        fontSize: isMobile ? '0.7rem' : '0.8rem',
        padding: '2px 10px',
        borderRadius: '999px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        whiteSpace: 'nowrap'
      }}
    >
      DEMO · datos de prueba
    </div>
  );
};
