import React, { useSyncExternalStore } from 'react';

// Franja fija arriba de todo mientras el navegador no tiene internet, para que nadie siga
// cargando pedidos o cobros creyendo que se están guardando. Desaparece sola al reconectar.

const suscribir = (aviso: () => void) => {
  window.addEventListener('online', aviso);
  window.addEventListener('offline', aviso);
  return () => {
    window.removeEventListener('online', aviso);
    window.removeEventListener('offline', aviso);
  };
};

export const BannerSinConexion: React.FC = () => {
  const enLinea = useSyncExternalStore(suscribir, () => navigator.onLine);
  if (enLinea) return null;

  return (
    <div
      role="alert"
      className="font-monospace fw-bold text-center d-flex align-items-center justify-content-center gap-2"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2100,
        backgroundColor: '#dc3545', color: '#ffffff', padding: '6px 12px', fontSize: '0.85rem'
      }}
    >
      <i className="bi bi-wifi-off" aria-hidden="true"></i>
      Sin conexión a internet: los cambios no se van a guardar hasta que vuelva.
    </div>
  );
};
