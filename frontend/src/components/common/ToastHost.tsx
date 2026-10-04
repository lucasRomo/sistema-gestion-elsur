import React, { useSyncExternalStore } from 'react';
import { toastStore, type TipoToast } from '../../config/toastStore';
import { useTheme } from '../../Context/ThemeContext';

const ESTILO: Record<TipoToast, { icono: string; color: string }> = {
  exito: { icono: 'bi-check-circle-fill', color: '#22c55e' },
  error: { icono: 'bi-exclamation-triangle-fill', color: '#dc3545' },
  info: { icono: 'bi-info-circle-fill', color: '#8e45e0' },
};

export const ToastHost: React.FC = () => {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (toasts.length === 0) return null;

  return (
    <div
      className="font-monospace d-flex flex-column gap-2"
      style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 2050, maxWidth: '380px' }}
      aria-live="polite"
    >
      {toasts.map((t) => {
        const { icono, color } = ESTILO[t.tipo];
        return (
          <div
            key={t.id}
            role="status"
            className="d-flex align-items-center gap-2 shadow-lg toast-entrada"
            style={{
              backgroundColor: isDark ? '#1a1a1c' : '#ffffff',
              color: isDark ? '#ffffff' : '#0f172a',
              border: `1px solid ${isDark ? '#3f3f46' : '#e2e8f0'}`,
              borderLeft: `4px solid ${color}`,
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '0.85rem'
            }}
          >
            <i className={`bi ${icono}`} style={{ color, fontSize: '1.1rem' }} aria-hidden="true"></i>
            <span className="flex-grow-1">{t.mensaje}</span>
            {t.accion && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 fw-bold text-decoration-none"
                style={{ color: '#8e45e0' }}
                onClick={() => {
                  t.accion?.onClick();
                  toastStore.cerrar(t.id);
                }}
              >
                {t.accion.texto}
              </button>
            )}
            <button
              type="button"
              className={`btn-close btn-sm ${isDark ? 'btn-close-white' : ''}`}
              aria-label="Cerrar aviso"
              onClick={() => toastStore.cerrar(t.id)}
            ></button>
          </div>
        );
      })}
    </div>
  );
};
