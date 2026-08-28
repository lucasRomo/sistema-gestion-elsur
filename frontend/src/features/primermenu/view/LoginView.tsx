import React from 'react';
import { LoginFeedbackModal } from '../../../components/modals/LoginFeedbackModal';
import fondoImg from '/src/assets/fondo-izq.png'; 
import logoGesta from '/src/assets/logo-gestapro.png';
import logoSur from '/src/assets/logo-elsur.png';
import { useTheme } from '../../../Context/ThemeContext';
import { useLogin } from '../hooks/useLogin';

interface LoginViewProps {
  onLoginExitoso: (usuario: any) => void;
  onVolver: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginExitoso, onVolver }) => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';

  const bgDerecho = esOscuro ? '#1a1a1c' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';
  const inputBg = esOscuro ? '#212529' : '#ffffff';
  const inputBorder = esOscuro ? '#495057' : '#cbd5e1';

  const {
    credentials,
    setCredentials,
    verPassword,
    toggleVerPassword,
    modalFeedback,
    handleLogin,
    handleCerrarModalFeedback
  } = useLogin({ onLoginExitoso });

  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row overflow-x-hidden">
      {/* IZQUIERDA: GESTAPRO */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4"
        style={{
          minHeight: '28vh',
          backgroundColor: '#1a0b2e',
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid #4c1d95',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
          zIndex: 10
        }}
      >
        <img src={logoGesta} alt="GestaPro" style={{ maxWidth: '280px', width: '100%', height: 'auto' }} />
      </div>

      {/* DERECHA: LOGIN */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4 flex-grow-1"
        style={{ backgroundColor: bgDerecho, transition: 'background-color 0.3s ease', minHeight: '72vh' }}
      >
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '320px' }}>
          
          <div className="text-center mb-4">
            <img 
              src={logoSur} 
              alt="El SUR" 
              className="mb-2" 
              style={{ 
                maxWidth: '160px',
                height: 'auto',
                filter: esOscuro ? 'none' : 'drop-shadow(0px 0px 1px #000000) drop-shadow(0px 0px 1px #000000)'
              }} 
            />
            <h2 className="fs-4 fw-bold m-0" style={{ color: textColor }}>el SUR</h2>
          </div>

          <div className="mb-3">
            <label className="form-label small" style={{ color: textColor }}>Usuario</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ingrese el Nombre de Usuario" 
              value={credentials.nombreUsuario}
              onChange={e => setCredentials({...credentials, nombreUsuario: e.target.value})} 
              required
              style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textColor }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label small" style={{ color: textColor }}>Contraseña</label>
            <div className="input-group">
              <input 
                type={verPassword ? 'text' : 'password'} 
                className="form-control" 
                placeholder="Ingrese la Contraseña" 
                value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})} 
                required
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textColor }}
              />
              <button 
                type="button"
                className="btn btn-outline-secondary"
                onClick={toggleVerPassword}
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textColor }}
              >
                <i className={`bi ${verPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn w-100 mb-2 fw-semibold py-2" 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid #8e45e0',
              color: esOscuro ? '#ffffff' : '#8e45e0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8e45e0';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = esOscuro ? '#ffffff' : '#8e45e0';
            }}
          >
            Iniciar Sesión
          </button>

          <button 
            type="button" 
            className="btn w-100 fw-semibold py-2" 
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid #8e45e0',
              color: esOscuro ? '#ffffff' : '#8e45e0',
              transition: 'all 0.3s ease'
            }}
            onClick={onVolver}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8e45e0';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = esOscuro ? '#ffffff' : '#8e45e0';
            }}
          >
            Volver
          </button>
        </form>
      </div>

      <LoginFeedbackModal {...modalFeedback} onAceptar={handleCerrarModalFeedback} />
    </div>
  );
};