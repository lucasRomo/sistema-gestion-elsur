import React, { useState } from 'react';
import { LoginFeedbackModal } from '../../components/auth/LoginFeedbackModal';

interface LoginViewProps {
  onLoginExitoso: (usuario: any) => void;
  onVolver: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginExitoso, onVolver }) => {
  const [credentials, setCredentials] = useState({ nombreUsuario: '', password: '' });
  const [verPassword, setVerPassword] = useState(false);

  // Estado para el manejo del modal de feedback
  const [modalFeedback, setModalFeedback] = useState<{
    mostrar: boolean;
    tipo: 'exito' | 'error' | null;
    mensaje: string;
  }>({
    mostrar: false,
    tipo: null,
    mensaje: ''
  });

  // Guardamos temporalmente el usuario que responde el backend para procesarlo tras cerrar el modal de éxito
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
        const usuario = await response.json();
        
        // 1. Guardamos el usuario en localStorage tal como solicitaste
        localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        
        // 2. Almacenamos temporalmente para pasarlo al contexto luego de presionar "Aceptar"
        setUsuarioTemporal(usuario);

        // 3. Desplegamos el modal de bienvenida
        setModalFeedback({
          mostrar: true,
          tipo: 'exito',
          mensaje: `Sesión iniciada correctamente como ${usuario.persona?.nombre || credentials.nombreUsuario}.`
        });
      } else {
        setModalFeedback({
          mostrar: true,
          tipo: 'error',
          mensaje: 'El usuario o la contraseña ingresados son incorrectos. Por favor, verifique los datos.'
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
    <>
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#18181b' }}>
        <form 
          onSubmit={handleLogin} 
          className="p-4 rounded bg-dark border text-white" 
          style={{ width: '360px', borderColor: '#27272a' }}
        >
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock-fill text-info fs-1 mb-2"></i>
            <h3 className="fw-bold m-0">Iniciar Sesión</h3>
            <p className="text-secondary small">Gestión de Sistemas - El Sur</p>
          </div>

          {/* Campo de Usuario */}
          <div className="mb-3">
            <label className="form-label small text-light">Usuario</label>
            <div className="input-group">
              <span className="input-group-text bg-zinc border-secondary text-secondary">
                <i className="bi bi-person-fill"></i>
              </span>
              <input 
                type="text"
                className="form-control bg-dark border-secondary text-white" 
                placeholder="Ingrese su usuario" 
                required
                value={credentials.nombreUsuario}
                onChange={e => setCredentials({...credentials, nombreUsuario: e.target.value})} 
              />
            </div>
          </div>

          {/* Campo de Contraseña con el Ojito */}
          <div className="mb-4">
            <label className="form-label small text-light">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-zinc border-secondary text-secondary">
                <i className="bi bi-lock-fill"></i>
              </span>
              <input 
                type={verPassword ? 'text' : 'password'} 
                className="form-control bg-dark border-secondary text-white" 
                placeholder="Ingrese su contraseña" 
                required
                value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})} 
              />
              <button 
                type="button"
                className="btn btn-outline-secondary border-secondary bg-dark text-secondary"
                onClick={() => setVerPassword(!verPassword)}
              >
                <i className={`bi ${verPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              </button>
            </div>
          </div>

          {/* Acciones */}
          <button type="submit" className="btn btn-info w-100 mb-2 fw-semibold text-dark">
            Ingresar al Sistema
          </button>
          <button type="button" className="btn btn-outline-secondary w-100 text-white border-secondary" onClick={onVolver}>
            Volver
          </button>
        </form>
      </div>

      {/* Renderizado del Modal de Mensajes */}
      <LoginFeedbackModal 
        mostrar={modalFeedback.mostrar}
        tipo={modalFeedback.tipo}
        mensaje={modalFeedback.mensaje}
        onAceptar={handleCerrarModalFeedback}
      />
    </>
  );
};