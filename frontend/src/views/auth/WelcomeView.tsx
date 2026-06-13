import React from 'react';

// Definimos las propiedades que va a recibir el componente para controlar la navegación
interface WelcomeViewProps {
  onIrARegistro: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onIrARegistro }) => {
  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row" style={{ backgroundColor: '#121214' }}>
      
      {/* SECCIÓN IZQUIERDA: LOGO GESTAPRO */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5 text-center position-relative"
        style={{
          backgroundColor: '#1a0b2e', // Violeta muy oscuro de fondo
          borderRight: '1px solid #3c1e6d'
        }}
      >
        {/* Recreación del logo {G} con Bootstrap Icons y texto */}
        <div className="d-flex align-items-center justify-content-center mb-3">
          <span className="fs-1 fw-bold" style={{ color: '#a855f7' }}>{"{"}</span>
          <div 
            className="d-flex align-items-center justify-content-center mx-2 rounded-circle border border-4"
            style={{ width: '70px', height: '70px', borderColor: '#a855f7 !important', color: '#a855f7' }}
          >
            <i className="bi bi-gear-fill fs-2"></i> {/* Usamos un engranaje estilizado como la G */}
          </div>
          <span className="fs-1 fw-bold" style={{ color: '#a855f7' }}>{"}"}</span>
        </div>
        
        <h1 className="display-4 fw-bold text-white m-0">
          Gesta<span style={{ color: '#a855f7' }}>Pro</span>
        </h1>
      </div>

      {/* SECCIÓN DERECHA: BIENVENIDA Y ACCIONES */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5"
        style={{ backgroundColor: '#18181b' }} // Gris oscuro del figma
      >
        <div className="w-100" style={{ maxWidth: '360px' }}>
          
          {/* Logo El Sur Recreado */}
          <div className="text-center mb-4 text-white">
            <div className="mb-2" style={{ color: '#e4e4e7' }}>
              <i className="bi bi-triangle-half fs-1"></i> {/* Icono que emula las formas geométricas */}
            </div>
            <h2 className="fs-3 fw-light m-0 tracking-wide">el <span className="fw-bold">SUR</span></h2>
          </div>

          <h2 className="text-white text-center display-6 fw-semibold mb-5">Bienvenido</h2>

          {/* Botones de Acción */}
          <div className="d-flex flex-column gap-3">
            <button 
              className="btn w-100 py-2 text-white fw-medium transition"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4c1d95',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c1d95'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Iniciar Sesión
            </button>

            <button 
              className="btn w-100 py-2 text-white fw-medium transition"
              onClick={onIrARegistro} // <-- Vinculamos la función de navegación acá
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4c1d95',
                borderRadius: '8px'
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