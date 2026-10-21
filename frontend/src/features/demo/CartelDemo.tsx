import React from 'react';

// Cartelito fijo que avisa que es la demo: no tapa nada (no recibe clics).
export const CartelDemo: React.FC = () => (
  <div
    className="font-monospace small"
    style={{
      position: 'fixed',
      top: 6,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2000,
      pointerEvents: 'none',
      backgroundColor: 'rgba(142, 69, 224, 0.92)',
      color: '#ffffff',
      padding: '2px 12px',
      borderRadius: '999px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      whiteSpace: 'nowrap'
    }}
  >
    DEMO · datos de prueba
  </div>
);
