import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface LoginFeedbackModalProps {
  mostrar: boolean;
  tipo: 'exito' | 'error' | null;
  mensaje: string;
  onAceptar: () => void;
}

export const LoginFeedbackModal: React.FC<LoginFeedbackModalProps> = ({ mostrar, tipo, mensaje, onAceptar }) => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';
  const botonRef = useRef<HTMLButtonElement>(null);

  // Al abrirse, el cartel toma el foco: antes el cursor seguía en el campo de contraseña y cada
  // Enter volvía a enviar el formulario (iniciaba sesión otra vez). Ahora Enter o Esc lo cierran.
  useEffect(() => {
    if (!mostrar || !tipo) return;
    (document.activeElement as HTMLElement | null)?.blur();
    botonRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onAceptar();
      }
    };
    document.addEventListener('keydown', alTeclear, true);
    return () => document.removeEventListener('keydown', alTeclear, true);
  }, [mostrar, tipo, onAceptar]);

  if (!mostrar || !tipo) return null;

  const esExito = tipo === 'exito';

  // Colores según el tema
  const bgOverlay = esOscuro ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.55)';
  const bgCard = esOscuro ? '#18181b' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const textSecundario = esOscuro ? '#a1a1aa' : '#64748b';

  return (
    <div className="modal d-block" style={{ backgroundColor: bgOverlay, zIndex: 1100 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered" style={{ maxWidth: '380px' }}>
        <div
          className="modal-content p-4 text-center"
          style={{
            backgroundColor: bgCard,
            border: '2px solid #8e45e0',
            color: textColor,
            transition: 'background-color 0.3s ease'
          }}
        >
          <div className="mb-2">
            {esExito ? (
              <i className="bi bi-check-circle-fill fs-1" style={{ color: '#8e45e0' }}></i>
            ) : (
              <i className="bi bi-x-circle-fill fs-1" style={{ color: '#8e45e0' }}></i>
            )}
          </div>

          <h5 className="fw-bold mb-2" style={{ color: textColor }}>
            {esExito ? '¡Bienvenido!' : 'Error de Inicio'}
          </h5>

          <p className="small mb-4" style={{ color: textSecundario }}>
            {mensaje}
          </p>

          <div className="d-flex justify-content-center">
            <button
              ref={botonRef}
              type="button"
              className="btn btn-sm px-4 fw-bold"
              style={{
                backgroundColor: '#8e45e0',
                borderColor: '#8e45e0',
                color: '#ffffff'
              }}
              onClick={onAceptar}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};