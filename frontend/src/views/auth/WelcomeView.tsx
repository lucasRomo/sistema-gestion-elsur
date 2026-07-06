import React from 'react';
import fondoImg from '../../assets/fondo-izq.png';
import logoGesta from '../../assets/logo-gestapro.png';
import logoSur from '../../assets/logo-elsur.png';

// Agregamos onIrALogin a la interfaz
interface WelcomeViewProps {
  onIrARegistro: () => void;
  onIrALogin: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onIrARegistro, onIrALogin }) => {
  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row">
      
      {/* SECCIÓN IZQUIERDA: FONDO MORADO CON LOGO GESTAPRO */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5 text-center"
        style={{
          backgroundColor: '#1a0b2e',
          backgroundImage: `url(${fondoImg})`, // Aquí va tu imagen de fondo
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: '1px solid #3c1e6d'
        }}
      >
        <div className="d-flex align-items-center justify-content-center mb-3">
          <img src={logoGesta} alt="GestaPro Logo" className="img-fluid" style={{ maxWidth: '500px' }} />
      </div>

      </div>
      {/* SECCIÓN DERECHA: LOGO "EL SUR" Y BOTONES */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5"
        style={{ backgroundColor: '#1a1a1c' }}
      >
        <div className="w-100" style={{ maxWidth: '320px' }}>
          <div className="d-flex flex-column align-items-center mb-4">
          <img src={logoSur} alt="El SUR" className="img-fluid mb-2" style={{ maxWidth: '200px' }} />
          <h2 className="fs-2 fw-bold text-white m-0" style={{ letterSpacing: '2px' }}>EL SUR</h2>
        </div>

          <h2 className="text-white text-center fw-bold mb-4">Bienvenido</h2>

          {/* Botones de Acción */}
          <div className="d-flex flex-column gap-3">
            <button 
              className="btn w-100 py-2 text-white fw-bold shadow-sm"
              onClick={onIrALogin}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4c1d95',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c1d95'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Iniciar Sesión
            </button>

            <button 
              className="btn w-100 py-2 text-white fw-bold shadow-sm"
              onClick={onIrARegistro}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4c1d95',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c1d95'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};