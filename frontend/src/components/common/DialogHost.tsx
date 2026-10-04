import React, { useSyncExternalStore } from 'react';
import { dialogStore, type TipoDialogo } from '../../config/dialogStore';
import { useTheme } from '../../Context/ThemeContext';

const COLOR_MORADO = '#8e45e0';

const ICONOS: Record<TipoDialogo, { icono: string; color: string }> = {
  aviso: { icono: 'bi-exclamation-circle-fill', color: COLOR_MORADO },
  error: { icono: 'bi-exclamation-triangle-fill', color: '#dc3545' },
  exito: { icono: 'bi-check-circle-fill', color: COLOR_MORADO },
  confirmar: { icono: 'bi-question-circle-fill', color: COLOR_MORADO },
};

export const DialogHost: React.FC = () => {
  const dialogo = useSyncExternalStore(dialogStore.subscribe, dialogStore.getSnapshot);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!dialogo) return null;

  const { icono, color } = ICONOS[dialogo.tipo];
  const esConfirmacion = dialogo.tipo === 'confirmar';

  const modalBg = isDark ? '#1a1a1c' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const messageColor = isDark ? '#a1a1aa' : '#475569';
  const borderColor = dialogo.tipo === 'error' ? '#dc3545' : (isDark ? COLOR_MORADO : '#cbd5e1');

  return (
    <div
      className="modal d-block font-monospace"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2100 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
        <div
          className="modal-content p-4 text-center shadow-lg mx-3"
          style={{ backgroundColor: modalBg, color: textColor, border: `2px solid ${borderColor}`, borderRadius: '16px' }}
        >
          <div className="mb-3">
            <i className={`bi ${icono}`} style={{ fontSize: '3rem', color }}></i>
          </div>

          <h4 className="fw-bold mb-3" style={{ color: textColor }}>{dialogo.titulo}</h4>

          <p className="small mb-4 px-2" style={{ color: messageColor, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
            {dialogo.mensaje}
          </p>

          <div className="d-flex justify-content-center gap-2">
            {esConfirmacion && (
              <button
                type="button"
                className="btn px-4 fw-semibold"
                style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', borderRadius: '8px', color: '#ffffff' }}
                onClick={() => dialogStore.cerrar(dialogo.id, false)}
              >
                {dialogo.textoCancelar}
              </button>
            )}
            <button
              type="button"
              autoFocus
              className="btn px-4 fw-semibold"
              style={
                esConfirmacion
                  ? { backgroundColor: '#198754', borderColor: '#198754', borderRadius: '8px', color: '#ffffff' }
                  : { backgroundColor: '#6c757d', borderColor: '#6c757d', borderRadius: '8px', color: '#ffffff' }
              }
              onClick={() => dialogStore.cerrar(dialogo.id, true)}
            >
              {dialogo.textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
