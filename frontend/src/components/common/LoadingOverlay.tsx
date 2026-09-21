import React, { useSyncExternalStore } from 'react';
import { loadingStore } from '../../config/loadingStore';

const COLOR_MORADO = '#8e45e0';

export const LoadingOverlay: React.FC = () => {
  const { visible, mensaje } = useSyncExternalStore(
    loadingStore.subscribe,
    loadingStore.getSnapshot
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(24, 24, 27, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="spinner-border mb-3"
        role="status"
        style={{ color: COLOR_MORADO, width: '3rem', height: '3rem' }}
      />
      <h5 className="text-white font-monospace fw-bold m-0 text-center px-3">{mensaje}</h5>
    </div>
  );
};