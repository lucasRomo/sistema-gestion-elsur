import React, { useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { obtenerPasswordReal } from '../services/usuarioService';

interface VerPasswordModalProps {
  usuario: any;
  onCerrar: () => void;
}

// Reautenticación + revelado de contraseña para Gestión de Usuarios (solo ADMIN,
// validado también en el backend). Primero pide la contraseña de quien está
// logueado ahora mismo (no la del usuario que se quiere ver); si es correcta,
// el backend desencripta y acá se muestra en pantalla.
export const VerPasswordModal: React.FC<VerPasswordModalProps> = ({ usuario, onCerrar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [passwordRevelada, setPasswordRevelada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalText = isDark ? '#ffffff' : '#18181b';
  const descColor = isDark ? '#a1a1aa' : '#64748b';
  const modalBorder = isDark ? '#8e45e0' : '#cbd5e1';
  const inputBg = isDark ? '#222122' : '#f8fafc';

  const confirmar = async () => {
    if (!passwordAdmin.trim()) {
      setError('Ingresá tu contraseña para confirmar.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const real = await obtenerPasswordReal(usuario.idUsuario, passwordAdmin);
      setPasswordRevelada(real);
    } catch (e: any) {
      setError(e?.message || 'No se pudo verificar. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content font-monospace shadow-lg"
          style={{ backgroundColor: modalBg, color: modalText, border: `1px solid ${modalBorder}` }}
        >
          <div className="modal-body text-center py-4 px-4">
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.5rem', color: '#8e45e0' }}></i>

            {passwordRevelada === null ? (
              <>
                <h5 className="mt-3 fw-bold" style={{ color: modalText }}>
                  Ver contraseña de {usuario?.nombreUsuario}
                </h5>
                <p style={{ color: descColor }} className="mb-3">
                  Por seguridad, confirmá tu propia contraseña de administrador para continuar.
                </p>
                <input
                  type="password"
                  className="form-control font-monospace mb-2"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${modalBorder}` }}
                  placeholder="Tu contraseña"
                  value={passwordAdmin}
                  onChange={(e) => setPasswordAdmin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmar()}
                  autoFocus
                />
                {error && <p className="text-danger mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{error}</p>}
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button className="btn fw-bold px-4" style={{ backgroundColor: '#3f3f46', color: '#fff' }} onClick={onCerrar}>
                    Cancelar
                  </button>
                  <button
                    className="btn fw-bold px-4"
                    style={{ backgroundColor: '#8e45e0', color: '#fff' }}
                    onClick={confirmar}
                    disabled={cargando}
                  >
                    {cargando ? 'Verificando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h5 className="mt-3 fw-bold" style={{ color: modalText }}>
                  Contraseña de {usuario?.nombreUsuario}
                </h5>
                <p style={{ color: descColor }} className="mb-2">
                  Se muestra solo en esta pantalla, no queda guardada visible en ningún lado.
                </p>
                <div
                  className="p-2 rounded-2 fw-bold"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${modalBorder}`, wordBreak: 'break-all' }}
                >
                  {passwordRevelada}
                </div>
                <button
                  className="btn mt-4 px-4 fw-bold"
                  style={{ backgroundColor: '#e22e2e', borderColor: '#e62020', color: '#ffffff' }}
                  onClick={onCerrar}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
