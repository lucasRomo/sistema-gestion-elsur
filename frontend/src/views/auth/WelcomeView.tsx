import React from 'react';
import fondoImg from '../../assets/fondo-izq.png';
import logoGesta from '../../assets/logo-gestapro.png';
import logoSur from '../../assets/logo-elsur.png';
import { useTheme } from '../../Context/ThemeContext'; // Importar contexto

interface WelcomeViewProps {
  onIrARegistro: () => void;
  onIrALogin: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onIrARegistro, onIrALogin }) => {
  const { theme } = useTheme();
  const esOscuro = theme === 'dark';

  // Variables dinámicas
  const bgDerecho = esOscuro ? '#1a1a1c' : '#ffffff';
  const textColor = esOscuro ? '#ffffff' : '#0f172a';

  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row">
      
      {/* SECCIÓN IZQUIERDA */}
<div 
  className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5 text-center"
  style={{
    backgroundColor: '#1a0b2e',
    backgroundImage: `url(${fondoImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRight: '1px solid #4c1d95',
    boxShadow: '4px 0 15px rgba(0, 0, 0, 0.15)',
    zIndex: 10
  }}
>
  <div className="d-flex align-items-center justify-content-center mb-3">
    <img src={logoGesta} alt="GestaPro Logo" className="img-fluid" style={{ maxWidth: '500px' }} />
  </div>
</div>

      {/* SECCIÓN DERECHA */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5"
        style={{ backgroundColor: bgDerecho, transition: 'background-color 0.3s ease' }}
      >
        <div className="w-100" style={{ maxWidth: '320px' }}>
          <div className="d-flex flex-column align-items-center mb-4">
            <img 
              src={logoSur} 
              alt="El SUR" 
              className="img-fluid mb-2" 
              style={{ 
                maxWidth: '200px',
                filter: esOscuro ? 'none' : 'drop-shadow(0px 0px 1px #000000) drop-shadow(0px 0px 1px #000000)'
              }} 
            />
            <h2 className="fs-2 fw-bold m-0" style={{ letterSpacing: '2px', color: textColor }}>EL SUR</h2>
          </div>

          <h2 className="text-center fw-bold mb-4" style={{ color: textColor }}>Bienvenido</h2>

          {/* Botones */}
          <div className="d-flex flex-column gap-3">
            <button 
              className="btn w-100 py-2 fw-bold shadow-sm"
              onClick={onIrALogin}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #8e45e0',
                color: esOscuro ? '#ffffff' : '#8e45e0',
                borderRadius: '6px',
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
              className="btn w-100 py-2 fw-bold shadow-sm"
              onClick={onIrARegistro}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #8e45e0',
                color: esOscuro ? '#ffffff' : '#8e45e0',
                borderRadius: '6px',
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
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};