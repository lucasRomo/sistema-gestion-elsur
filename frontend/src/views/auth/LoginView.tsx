import React, { useState } from 'react';
import { LoginFeedbackModal } from '../../features/modals/LoginFeedbackModal';
import fondoImg from '../../assets/fondo-izq.png'; 
import logoGesta from '../../assets/logo-gestapro.png';
import logoSur from '../../assets/logo-elsur.png';

interface LoginViewProps {
  onLoginExitoso: (usuario: any) => void;
  onVolver: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginExitoso, onVolver }) => {
  const [credentials, setCredentials] = useState({ nombreUsuario: '', password: '' });
  const [verPassword, setVerPassword] = useState(false);

  const [modalFeedback, setModalFeedback] = useState<{
    mostrar: boolean;
    tipo: 'exito' | 'error' | null;
    mensaje: string;
  }>({
    mostrar: false,
    tipo: null,
    mensaje: ''
  });

  const [usuarioTemporal, setUsuarioTemporal] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        
        const token = data.token || "token_simulado_el_sur_2026";
        const usuario = data.usuario || data; 
        
        localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        localStorage.setItem('token_sesion', token); 
        
        setUsuarioTemporal(usuario);

        setModalFeedback({
          mostrar: true,
          tipo: 'exito',
          mensaje: `Sesión iniciada correctamente como ${usuario.persona?.nombre || credentials.nombreUsuario}.`
        });
      } else {
  
    let mensajeError = 'El usuario o la contraseña ingresados son incorrectos. Por favor, verifique los datos.';

    if (response.status === 403) {
     mensajeError = 'La cuenta que usted ingresó está en estado de Pendiente y/o Desactivado y necesita ser Activada para continuar, por favor contáctese con el administrador.';
    }

    setModalFeedback({
    mostrar: true,
    tipo: 'error',
    mensaje: mensajeError
  });
  }
    } catch (error) {
      setModalFeedback({
        mostrar: true,
        tipo: 'error',
        mensaje: 'No se pudo establecer conexión con el servidor de El Sur. Intente más tarde.'
      });
    }
  };

  const handleCerrarModalFeedback = () => {
    const fueExito = modalFeedback.tipo === 'exito';
    setModalFeedback({ mostrar: false, tipo: null, mensaje: '' });

    if (fueExito && usuarioTemporal) {
      onLoginExitoso(usuarioTemporal);
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0 m-0 d-flex flex-column flex-md-row">
      {/* IZQUIERDA: GESTAPRO */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center"
        style={{
          backgroundColor: '#1a0b2e',
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: '1px solid #4c1d95'
        }}
      >
        <img src={logoGesta} alt="GestaPro" style={{ maxWidth: '500px' }} />
      </div>

      {/* DERECHA: LOGIN */}
      <div 
        className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center"
        style={{ backgroundColor: '#1a1a1c' }}
      >
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '300px' }}>
          
          {/* Logo el SUR */}
          <div className="text-center mb-4">
            <img src={logoSur} alt="El SUR" className="mb-2" style={{ maxWidth: '200px' }} />
            <h2 className="fs-3 fw-bold text-white m-0">el SUR</h2>
          </div>

          {/* Inputs */}
          <div className="mb-3">
            <label className="form-label text-white small">Usuario</label>
            <input 
              type="text" className="form-control bg-dark border-secondary text-white" 
              placeholder="Ingrese el Nombre de Usuario" value={credentials.nombreUsuario}
              onChange={e => setCredentials({...credentials, nombreUsuario: e.target.value})} required
            />
          </div>

          <div className="mb-4">
          <label className="form-label text-white small">Contraseña</label>
          <div className="input-group">
          <input 
          type={verPassword ? 'text' : 'password'} 
          className="form-control bg-dark border-secondary text-white" 
          placeholder="Ingrese la Contraseña" 
          value={credentials.password}
          onChange={e => setCredentials({...credentials, password: e.target.value})} 
          required
          />
          <button 
          type="button"
          className="btn btn-outline-secondary border-secondary bg-dark text-secondary"
          onClick={() => setVerPassword(!verPassword)}
        >
      <i className={`bi ${verPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-white`}></i>
    </button>
  </div>
</div>

          {/* Botones */}
          <button type="submit" className="btn btn-outline-secondary w-100 mb-2 text-white" style={{ borderColor: '#4c1d95' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c1d95'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            Iniciar Sesión
          </button>
          <button type="button" className="btn btn-outline-secondary w-100 text-white" style={{ borderColor: '#4c1d95' }} onClick={onVolver}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c1d95'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            Volver
          </button>
        </form>
      </div>

      <LoginFeedbackModal {...modalFeedback} onAceptar={handleCerrarModalFeedback} />
    </div>
  );
};