import { useState } from 'react';

interface UseLoginProps {
  onLoginExitoso: (usuario: any) => void;
}

export const useLogin = ({ onLoginExitoso }: UseLoginProps) => {
  const [credentials, setCredentials] = useState({ nombreUsuario: '', password: '' });
  const [verPassword, setVerPassword] = useState(false);
  const [usuarioTemporal, setUsuarioTemporal] = useState<any>(null);

  const [modalFeedback, setModalFeedback] = useState<{
    mostrar: boolean;
    tipo: 'exito' | 'error' | null;
    mensaje: string;
  }>({
    mostrar: false,
    tipo: null,
    mensaje: ''
  });

  const toggleVerPassword = () => setVerPassword((prev) => !prev);

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
        setModalFeedback({ mostrar: true, tipo: 'error', mensaje: mensajeError });
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

  return {
    credentials,
    setCredentials,
    verPassword,
    toggleVerPassword,
    modalFeedback,
    handleLogin,
    handleCerrarModalFeedback
  };
};