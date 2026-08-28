import React from 'react';
import fondoImg from '/src/assets/fondo-izq.png'; 
import logoGesta from '/src/assets/logo-gestapro.png';
import logoSur from '/src/assets/logo-elsur.png';
import { useTheme } from '../../../Context/ThemeContext'; 

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
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row overflow-x-hidden">
      
      {/* SECCIÓN IZQUIERDA */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4 text-center"
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
        <div className="d-flex align-items-center justify-content-center">
          <img src={logoGesta} alt="GestaPro Logo" className="img-fluid" style={{ maxWidth: '280px', width: '100%', height: 'auto' }} />
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-4 flex-grow-1"
        style={{ backgroundColor: bgDerecho, transition: 'background-color 0.3s ease', minHeight: '72vh' }}
      >
        <div className="w-100" style={{ maxWidth: '320px' }}>
          <div className="d-flex flex-column align-items-center mb-3">
            <img 
              src={logoSur} 
              alt="El SUR" 
              className="img-fluid mb-2" 
              style={{ 
                maxWidth: '160px',
                height: 'auto',
                filter: esOscuro ? 'none' : 'drop-shadow(0px 0px 1px #000000) drop-shadow(0px 0px 1px #000000)'
              }} 
            />
            <h2 className="fs-4 fw-bold m-0" style={{ letterSpacing: '2px', color: textColor }}>EL SUR</h2>
          </div>

          <h2 className="text-center fw-bold mb-4 fs-4" style={{ color: textColor }}>Bienvenido</h2>

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

            {/* Oculto en mobile (d-none), visible a partir de pantallas medianas (d-md-block) */}
            <button 
              className="btn w-100 py-2 fw-bold shadow-sm d-none d-md-block"
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