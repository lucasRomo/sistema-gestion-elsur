import React, { useState } from 'react';

export const ConfiguracionView: React.FC = () => {
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargando, setCargando] = useState(false);

  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!passwords.nueva || !passwords.confirmar) {
      setMensaje({ texto: 'Por favor completa todos los campos requeridos.', tipo: 'error' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMensaje({ texto: 'Las nuevas contraseñas no coinciden.', tipo: 'error' });
      return;
    }
    if (passwords.nueva.length < 4) {
      setMensaje({ texto: 'La contraseña debe tener al menos 4 caracteres.', tipo: 'error' });
      return;
    }

    setCargando(true);
    try {
      const idUsuario = usuario?.idUsuario || 1;
      const response = await fetch(`http://localhost:8080/api/usuarios/${idUsuario}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' }, // Cambiamos a texto plano
        body: passwords.nueva // Enviamos el string directo sin JSON.stringify
      });

      if (response.ok) {
        setMensaje({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
        setPasswords({ actual: '', nueva: '', confirmar: '' });
      } else {
        setMensaje({ texto: 'Error al cambiar la contraseña en el servidor.', tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ texto: 'Error de conexión con el backend (Puerto 8080).', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container-fluid text-white font-monospace">
      <div className="mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
        <h2 className="fw-bold mb-1">Configuración de la Cuenta</h2>
        <p className="text-white-50 mb-0 small">Administración de credenciales y seguridad personal del empleado</p>
      </div>

      <div className="row justify-content-center mt-5">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="p-4 rounded-4 shadow" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ backgroundColor: '#222122', borderLeft: '4px solid #8e45e0' }}>
              <i className="bi bi-person-bounding-box fs-3" style={{ color: '#8e45e0' }}></i>
              <div>
                <h6 className="mb-0 fw-bold">{usuario?.persona?.nombre} {usuario?.persona?.apellido}</h6>
                <span className="text-white-50 small">Usuario: <b>@{usuario?.nombreUsuario}</b></span>
              </div>
            </div>

            <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>Cambiar Contraseña Propia</h5>

            {mensaje && (
              <div className={`alert ${mensaje.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                <i className={`bi ${mensaje.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-white-50 small">Contraseña Actual</label>
                <input 
                  type="password" 
                  className="form-control bg-dark text-white border-secondary font-monospace"
                  placeholder="••••••••"
                  value={passwords.actual}
                  onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-white-50 small">Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="form-control bg-dark text-white border-secondary font-monospace"
                  placeholder="Mínimo 4 caracteres"
                  value={passwords.nueva}
                  onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-white-50 small">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="form-control bg-dark text-white border-secondary font-monospace"
                  placeholder="Repite la nueva contraseña"
                  value={passwords.confirmar}
                  onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={cargando}
                className="btn w-100 py-2 fw-bold text-white transition-all shadow" 
                style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
              >
                {cargando ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};