import React, { useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { obtenerPasswordReal, restablecerPassword } from '../services/usuarioService';

interface VerPasswordModalProps {
  usuario: any;
  onCerrar: () => void;
}

type Modo = 'menu' | 'ver' | 'restablecer' | 'restablecerExito';

export const VerPasswordModal: React.FC<VerPasswordModalProps> = ({ usuario, onCerrar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [modo, setModo] = useState<Modo>('menu');

  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [passwordRevelada, setPasswordRevelada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordNuevaConfirmar, setPasswordNuevaConfirmar] = useState('');

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalText = isDark ? '#ffffff' : '#18181b';
  const descColor = isDark ? '#a1a1aa' : '#64748b';
  const modalBorder = isDark ? '#8e45e0' : '#cbd5e1';
  const inputBg = isDark ? '#222122' : '#f8fafc';

  const volverAlMenu = () => {
    setModo('menu');
    setPasswordAdmin('');
    setPasswordRevelada(null);
    setPasswordNueva('');
    setPasswordNuevaConfirmar('');
    setError(null);
  };

  const confirmarVer = async () => {
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

  const confirmarRestablecer = async () => {
    if (!passwordAdmin.trim()) {
      setError('Ingresá tu contraseña para confirmar.');
      return;
    }
    if (passwordNueva.length < 8 || passwordNueva.length > 72) {
      setError('La nueva contraseña debe tener entre 8 y 72 caracteres.');
      return;
    }
    if (passwordNueva !== passwordNuevaConfirmar) {
      setError('Las dos contraseñas nuevas no coinciden.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await restablecerPassword(usuario.idUsuario, passwordAdmin, passwordNueva);
      setModo('restablecerExito');
    } catch (e: any) {
      setError(e?.message || 'No se pudo restablecer la contraseña. Intentá de nuevo.');
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

            {modo === 'menu' && (
              <>
                <h5 className="mt-3 fw-bold" style={{ color: modalText }}>
                  Contraseña de {usuario?.nombreUsuario}
                </h5>
                <p style={{ color: descColor }} className="mb-3">
                  Elegí qué querés hacer. En los dos casos vas a tener que confirmar con tu propia contraseña.
                </p>
                <div className="d-flex flex-column gap-2 mt-3">
                  <button
                    className="btn fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#3f3f46', color: '#fff' }}
                    onClick={() => setModo('ver')}
                  >
                    <i className="bi bi-eye"></i> Ver contraseña actual
                  </button>
                  <button
                    className="btn fw-bold d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#8e45e0', color: '#fff' }}
                    onClick={() => setModo('restablecer')}
                  >
                    <i className="bi bi-key"></i> Restablecer contraseña
                  </button>
                </div>
                <div className="d-flex justify-content-center mt-4">
                  <button className="btn fw-bold px-4" style={{ backgroundColor: 'transparent', border: `1px solid ${modalBorder}`, color: modalText }} onClick={onCerrar}>
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {modo === 'ver' && passwordRevelada === null && (
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
                  onKeyDown={(e) => e.key === 'Enter' && confirmarVer()}
                  autoFocus
                />
                {error && <p className="text-danger mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{error}</p>}
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button className="btn fw-bold px-4" style={{ backgroundColor: '#3f3f46', color: '#fff' }} onClick={volverAlMenu}>
                    Volver
                  </button>
                  <button
                    className="btn fw-bold px-4"
                    style={{ backgroundColor: '#8e45e0', color: '#fff' }}
                    onClick={confirmarVer}
                    disabled={cargando}
                  >
                    {cargando ? 'Verificando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}

            {modo === 'ver' && passwordRevelada !== null && (
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

            {modo === 'restablecer' && (
              <>
                <h5 className="mt-3 fw-bold" style={{ color: modalText }}>
                  Restablecer contraseña de {usuario?.nombreUsuario}
                </h5>
                <p style={{ color: descColor }} className="mb-3">
                  Vas a fijarle una contraseña nueva sin necesitar la que tiene hoy. Confirmá primero con tu
                  propia contraseña de administrador.
                </p>
                <input
                  type="password"
                  className="form-control font-monospace mb-2"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${modalBorder}` }}
                  placeholder="Tu contraseña (para confirmar)"
                  value={passwordAdmin}
                  onChange={(e) => setPasswordAdmin(e.target.value)}
                  autoFocus
                />
                <input
                  type="password"
                  className="form-control font-monospace mb-2"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${modalBorder}` }}
                  placeholder={`Contraseña nueva para ${usuario?.nombreUsuario}`}
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                />
                <input
                  type="password"
                  className="form-control font-monospace mb-2"
                  style={{ backgroundColor: inputBg, color: modalText, border: `1px solid ${modalBorder}` }}
                  placeholder="Repetí la contraseña nueva"
                  value={passwordNuevaConfirmar}
                  onChange={(e) => setPasswordNuevaConfirmar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmarRestablecer()}
                />
                {error && <p className="text-danger mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{error}</p>}
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button className="btn fw-bold px-4" style={{ backgroundColor: '#3f3f46', color: '#fff' }} onClick={volverAlMenu}>
                    Volver
                  </button>
                  <button
                    className="btn fw-bold px-4"
                    style={{ backgroundColor: '#8e45e0', color: '#fff' }}
                    onClick={confirmarRestablecer}
                    disabled={cargando}
                  >
                    {cargando ? 'Guardando...' : 'Restablecer'}
                  </button>
                </div>
              </>
            )}

            {modo === 'restablecerExito' && (
              <>
                <h5 className="mt-3 fw-bold" style={{ color: modalText }}>
                  ¡Contraseña restablecida!
                </h5>
                <p style={{ color: descColor }} className="mb-2">
                  {usuario?.nombreUsuario} ya puede iniciar sesión con la contraseña nueva.
                </p>
                <button
                  className="btn mt-4 px-4 fw-bold"
                  style={{ backgroundColor: '#2b7a3e', borderColor: '#20c997', color: '#ffffff' }}
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
