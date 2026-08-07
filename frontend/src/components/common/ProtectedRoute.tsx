import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  soloAdmin?: boolean;
  permisoRequerido?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  soloAdmin = false, 
  permisoRequerido 
}) => {
  const usuarioGuardado = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');

  if (!usuarioGuardado) {
    return <Navigate to="/login" replace />;
  }

  let usuario: any;
  try {
    usuario = JSON.parse(usuarioGuardado);
  } catch (error) {
    console.error("Error al leer sesión:", error);
    return <Navigate to="/login" replace />;
  }

  const rol = usuario?.rol?.nombreRol?.toUpperCase() || '';
  const esAdmin = rol.includes('ADMIN') || rol.includes('GERENTE');

  if (soloAdmin && !esAdmin) {
    return <AccesoRestringidoUI />;
  }

  if (permisoRequerido) {
    const listaPermisos: any[] = usuario?.permisos || usuario?.rol?.permisos || [];
    
    if (Array.isArray(listaPermisos) && listaPermisos.length > 0) {
      const tienePermiso = listaPermisos.some((p: any) => 
        (typeof p === 'string' && p.toLowerCase() === permisoRequerido.toLowerCase()) ||
        (p && typeof p === 'object' && p.nombrePermiso && p.nombrePermiso.toLowerCase() === permisoRequerido.toLowerCase())
      );

      if (!tienePermiso) {
        return <AccesoRestringidoUI />;
      }
    } else if (!esAdmin) {
      return <AccesoRestringidoUI />;
    }
  }

  return <>{children}</>;
};

const AccesoRestringidoUI = () => (
  <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#18181b', color: 'white' }}>
    <div className="text-center p-5 rounded-4 font-monospace" style={{ backgroundColor: '#222122', border: '1px solid #ff4d4d', maxWidth: '500px' }}>
      <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '4rem' }}></i>
      <h3 className="fw-bold mt-3 text-white">ACCESO RESTRINGIDO</h3>
      <p className="text-white-50 mt-2">
        No tienes los permisos necesarios para acceder a este módulo del sistema.
      </p>
      <button 
        className="btn mt-4 px-4 py-2 fw-bold text-white" 
        style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
        onClick={() => window.history.back()}
      >
        <i className="bi bi-arrow-left me-2"></i>Volver
      </button>
    </div>
  </div>
);