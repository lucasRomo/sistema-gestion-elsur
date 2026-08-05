import React, { useState, useEffect } from 'react';
import { useTheme } from '../../Context/ThemeContext';

interface RespaldoLog {
  idRespaldo: number;
  fechaHora: string;
  nombreArchivo: string;
  tamanio: string;
  usuarioOperador: string;
  tipo: string;
}

export const ConfiguracionView: React.FC = () => {
  const { theme, toggleTheme } = useTheme(); 
  const esOscuro = theme === 'dark';

  const [opcionPerfil, setOpcionPerfil] = useState<'usuario' | 'password' | 'email'>('password');

  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const token = localStorage.getItem('token');

  // Estados para Cambio de Contraseña
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensajePass, setMensajePass] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoPass, setCargandoPass] = useState(false);

  // Estados para Cambio de Usuario
  const [datosUsuario, setDatosUsuario] = useState({ actual: usuario?.nombreUsuario || '', nuevo: '' });
  const [mensajeUsuario, setMensajeUsuario] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);

  // Estados para Cambio de Email
  const [datosEmail, setDatosEmail] = useState({ actual: usuario?.persona?.email || '', nuevo: '' });
  const [mensajeEmail, setMensajeEmail] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoEmail, setCargandoEmail] = useState(false);

  // Estados para Respaldos
  const [historialRespaldos, setHistorialRespaldos] = useState<RespaldoLog[]>([]);
  const [cargandoRespaldo, setCargandoRespaldo] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [cargandoRestaurar, setCargandoRestaurar] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    cargarHistorialRespaldos();
  }, []);

  const cargarHistorialRespaldos = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/respaldos/historial', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistorialRespaldos(data);
      }
    } catch (error) {
      console.error("Error al cargar historial de respaldos:", error);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePass(null);

    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      setMensajePass({ texto: 'Por favor completa todos los campos.', tipo: 'error' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMensajePass({ texto: 'Las nuevas contraseñas no coinciden.', tipo: 'error' });
      return;
    }

    setCargandoPass(true);
    try {
      const idUsuario = usuario?.idUsuario || 1;
      const response = await fetch(`http://localhost:8080/api/usuarios/${idUsuario}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passwordActual: passwords.actual,
          passwordNueva: passwords.nueva
        })
      });

      if (response.ok) {
        setMensajePass({ texto: '¡Contraseña actualizada con éxito!', tipo: 'exito' });
        setPasswords({ actual: '', nueva: '', confirmar: '' });
      } else {
        const err = await response.text();
        setMensajePass({ texto: err || 'Error al cambiar la contraseña.', tipo: 'error' });
      }
    } catch (error) {
      setMensajePass({ texto: 'Error de conexión con el backend.', tipo: 'error' });
    } finally {
      setCargandoPass(false);
    }
  };

  const handleCambiarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeUsuario(null);

    if (!datosUsuario.actual.trim() || !datosUsuario.nuevo.trim()) {
      setMensajeUsuario({ texto: 'Completa ambos campos de usuario.', tipo: 'error' });
      return;
    }

    setCargandoUsuario(true);
    try {
      const idUsuario = usuario?.idUsuario || 1;
      const response = await fetch(`http://localhost:8080/api/usuarios/${idUsuario}/username`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          usuarioActual: datosUsuario.actual, 
          usuarioNuevo: datosUsuario.nuevo 
        })
      });

      if (response.ok) {
        setMensajeUsuario({ texto: '¡Nombre de usuario actualizado!', tipo: 'exito' });
        if (usuario) {
          usuario.nombreUsuario = datosUsuario.nuevo;
          localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        }
        setDatosUsuario({ actual: datosUsuario.nuevo, nuevo: '' });
      } else {
        const errText = await response.text();
        setMensajeUsuario({ texto: errText || 'El usuario actual no coincide o no se pudo actualizar.', tipo: 'error' });
      }
    } catch (error) {
      setMensajeUsuario({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargandoUsuario(false);
    }
  };

  const handleCambiarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeEmail(null);

    if (!datosEmail.actual.trim() || !datosEmail.nuevo.trim()) {
      setMensajeEmail({ texto: 'Completa ambos campos de correo.', tipo: 'error' });
      return;
    }
    if (!datosEmail.nuevo.includes('@')) {
      setMensajeEmail({ texto: 'Ingresa un correo electrónico válido.', tipo: 'error' });
      return;
    }

    setCargandoEmail(true);
    try {
      const idUsuario = usuario?.idUsuario || 1;
      const response = await fetch(`http://localhost:8080/api/usuarios/${idUsuario}/email`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          emailActual: datosEmail.actual, 
          emailNuevo: datosEmail.nuevo 
        })
      });

      if (response.ok) {
        setMensajeEmail({ texto: '¡Email actualizado con éxito!', tipo: 'exito' });
        if (usuario && usuario.persona) {
          usuario.persona.email = datosEmail.nuevo;
          localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
        }
        setDatosEmail({ actual: datosEmail.nuevo, nuevo: '' });
      } else {
        const errText = await response.text();
        setMensajeEmail({ texto: errText || 'El email actual no coincide o no se pudo actualizar.', tipo: 'error' });
      }
    } catch (error) {
      setMensajeEmail({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargandoEmail(false);
    }
  };

  const handleGenerarRespaldo = async () => {
    setCargandoRespaldo(true);
    setMensajeRespaldo(null);
    try {
      const usuarioNombre = usuario?.nombreUsuario || 'Operario';
      const response = await fetch(`http://localhost:8080/api/respaldos/generar?usuario=${encodeURIComponent(usuarioNombre)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error al generar el respaldo");
      setMensajeRespaldo({ texto: 'Respaldo generado y guardado correctamente.', tipo: 'exito' });
      cargarHistorialRespaldos();
    } catch (error) {
      setMensajeRespaldo({ texto: 'No se pudo generar el respaldo.', tipo: 'error' });
    } finally {
      setCargandoRespaldo(false);
    }
  };

  const handleDescargarRespaldoHistorial = async (idRespaldo: number, nombreArchivo: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/respaldos/descargar/${idRespaldo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error al descargar");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("No se pudo descargar el archivo seleccionado.");
    }
  };

  const handleEliminarRespaldo = async (idRespaldo: number) => {
    if (!window.confirm("¿Deseas eliminar este respaldo?")) return;
    try {
      const response = await fetch(`http://localhost:8080/api/respaldos/${idRespaldo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMensajeRespaldo({ texto: 'Respaldo eliminado con éxito.', tipo: 'exito' });
        cargarHistorialRespaldos();
      }
    } catch (error) {
      setMensajeRespaldo({ texto: 'Error al eliminar el respaldo.', tipo: 'error' });
    }
  };

  const handleRestaurarRespaldoClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoSeleccionado) return;
    setMostrarModalConfirmacion(true);
  };

  const ejecutarRestauracion = async () => {
    setMostrarModalConfirmacion(false);
    setCargandoRestaurar(true);
    setMensajeRespaldo(null);
    const formData = new FormData();
    if (archivoSeleccionado) formData.append('archivo', archivoSeleccionado);

    try {
      const response = await fetch('http://localhost:8080/api/respaldos/restaurar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        setMensajeRespaldo({ texto: '¡Base de datos restaurada con éxito!', tipo: 'exito' });
        setArchivoSeleccionado(null);
      } else {
        const errorText = await response.text();
        setMensajeRespaldo({ texto: `Error al restaurar: ${errorText}`, tipo: 'error' });
      }
    } catch (error) {
      setMensajeRespaldo({ texto: 'Error de conexión al restaurar el respaldo.', tipo: 'error' });
    } finally {
      setCargandoRestaurar(false);
    }
  };

  // Clases dinámicas según el tema
  const cardBg = esOscuro ? '#18181b' : '#ffffff';
  const cardBorder = esOscuro ? '#3f3f46' : '#e4e4e7';
  const subBg = esOscuro ? '#222122' : '#f4f4f5';
  const textColor = esOscuro ? '#ffffff' : '#18181b';
  const mutedTextColor = esOscuro ? 'text-white-50' : 'text-muted';
  const inputBgClass = esOscuro ? 'bg-dark text-white border-secondary' : 'bg-light text-dark border-secondary';

  return (
    <div className={`container-fluid font-monospace pb-5 ${esOscuro ? 'text-white' : 'text-dark'}`}>
      <div className="mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: esOscuro ? '#2d2d30' : '#dee2e6' }}>
        <div className="text-center">
          <h3 className="fw-bold mb-0" style={{ color: textColor, fontSize: '1.8rem' }}>Configuración y Respaldo</h3>
        </div>
      </div>

      {/* SECCIÓN NUEVA: APARIENCIA DEL SISTEMA (MODO CLARO / OSCURO) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="p-3 rounded-4 shadow d-flex justify-content-between align-items-center" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex align-items-center gap-3">
              <i className={`bi ${esOscuro ? 'bi-moon-stars-fill text-warning' : 'bi-sun-fill text-primary'} fs-3`}></i>
              <div>
                <h6 className="fw-bold mb-0" style={{ color: textColor }}>Apariencia del Sistema</h6>
                <span className={`${mutedTextColor} small`}>
                  Modo actual: <b>{esOscuro ? 'Oscuro (Dark Mode)' : 'Claro (Light Mode)'}</b>
                </span>
              </div>
            </div>

            <div className="form-check form-switch fs-4 mb-0">
              <input 
                className="form-check-input style-switch" 
                type="checkbox" 
                role="switch"
                id="flexSwitchCheckDefault"
                checked={!esOscuro}
                onChange={toggleTheme}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label fs-6 align-middle ms-2" htmlFor="flexSwitchCheckDefault" style={{ color: textColor, cursor: 'pointer' }}>
                {esOscuro ? 'Cambiar a Claro' : 'Cambiar a Oscuro'}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* COLUMNA 1: Ajustes del Perfil */}
        <div className="col-12 col-lg-5">
          <div className="p-4 rounded-4 shadow h-100 d-flex flex-column" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ backgroundColor: subBg, borderLeft: '4px solid #8e45e0' }}>
              <i className="bi bi-person-bounding-box fs-3" style={{ color: '#8e45e0' }}></i>
              <div>
                <h6 className="mb-0 fw-bold" style={{ color: textColor }}>{usuario?.persona?.nombre} {usuario?.persona?.apellido}</h6>
                <span className={`${mutedTextColor} small`}>Usuario: <b>@{usuario?.nombreUsuario}</b></span>
              </div>
            </div>

            {/* Menú Tabs */}
            <div className="btn-group w-100 mb-4 p-1 rounded" style={{ backgroundColor: subBg, border: `1px solid ${cardBorder}` }}>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${opcionPerfil === 'usuario' ? 'btn-primary' : mutedTextColor}`}
                style={opcionPerfil === 'usuario' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
                onClick={() => setOpcionPerfil('usuario')}
              >
                <i className="bi bi-person me-1"></i> Usuario
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${opcionPerfil === 'password' ? 'btn-primary' : mutedTextColor}`}
                style={opcionPerfil === 'password' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
                onClick={() => setOpcionPerfil('password')}
              >
                <i className="bi bi-key me-1"></i> Contraseña
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${opcionPerfil === 'email' ? 'btn-primary' : mutedTextColor}`}
                style={opcionPerfil === 'email' ? { backgroundColor: '#8e45e0', borderColor: '#8e45e0' } : {}}
                onClick={() => setOpcionPerfil('email')}
              >
                <i className="bi bi-envelope me-1"></i> Email
              </button>
            </div>

            {/* FORMULARIO 1: CAMBIAR USUARIO */}
            {opcionPerfil === 'usuario' && (
              <div>
                <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
                  <i className="bi bi-person-gear me-2"></i>Modificar Nombre de Usuario
                </h5>

                {mensajeUsuario && (
                  <div className={`alert ${mensajeUsuario.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                    <i className={`bi ${mensajeUsuario.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                    {mensajeUsuario.texto}
                  </div>
                )}

                <form onSubmit={handleCambiarUsuario}>
                  <div className="mb-3">
                    <label className={`form-label ${mutedTextColor} small`}>Usuario Actual</label>
                    <input 
                      type="text" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      value={datosUsuario.actual}
                      onChange={(e) => setDatosUsuario({ ...datosUsuario, actual: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`form-label ${mutedTextColor} small`}>Nuevo Usuario</label>
                    <input 
                      type="text" 
                      className= {`form-control ${inputBgClass} font-monospace text-muted`}
                      placeholder="Ingrese nuevo nombre de usuario"
                      value={datosUsuario.nuevo}
                      onChange={(e) => setDatosUsuario({ ...datosUsuario, nuevo: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={cargandoUsuario}
                    className="btn w-100 py-2 fw-bold text-white shadow" 
                    style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
                  >
                    {cargandoUsuario ? 'Actualizando...' : 'Guardar Nuevo Usuario'}
                  </button>
                </form>
              </div>
            )}

            {/* FORMULARIO 2: CAMBIAR CONTRASEÑA */}
            {opcionPerfil === 'password' && (
              <div>
                <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
                  <i className="bi bi-shield-lock me-2"></i>Cambiar Contraseña Propia
                </h5>

                {mensajePass && (
                  <div className={`alert ${mensajePass.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                    <i className={`bi ${mensajePass.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                    {mensajePass.texto}
                  </div>
                )}

                <form onSubmit={handleCambiarPassword}>
                  <div className="mb-3">
                    <label className={`form-label ${mutedTextColor} small`}>Contraseña Actual</label>
                    <input 
                      type="password" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      placeholder="••••••••"
                      value={passwords.actual}
                      onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className={`form-label ${mutedTextColor} small`}>Nueva Contraseña</label>
                    <input 
                      type="password" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      placeholder="Mínimo 4 caracteres"
                      value={passwords.nueva}
                      onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`form-label ${mutedTextColor} small`}>Confirmar Nueva Contraseña</label>
                    <input 
                      type="password" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      placeholder="Repite la nueva contraseña"
                      value={passwords.confirmar}
                      onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={cargandoPass}
                    className="btn w-100 py-2 fw-bold text-white shadow" 
                    style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
                  >
                    {cargandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </form>
              </div>
            )}

            {/* FORMULARIO 3: CAMBIAR EMAIL */}
            {opcionPerfil === 'email' && (
              <div>
                <h5 className="fw-bold mb-3" style={{ color: '#8e45e0' }}>
                  <i className="bi bi-envelope-at me-2"></i>Modificar Correo Electrónico
                </h5>

                {mensajeEmail && (
                  <div className={`alert ${mensajeEmail.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                    <i className={`bi ${mensajeEmail.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                    {mensajeEmail.texto}
                  </div>
                )}

                <form onSubmit={handleCambiarEmail}>
                  <div className="mb-3">
                    <label className={`form-label ${mutedTextColor} small`}>Email Actual</label>
                    <input 
                      type="email" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      value={datosEmail.actual}
                      onChange={(e) => setDatosEmail({ ...datosEmail, actual: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`form-label ${mutedTextColor} small`}>Nuevo Email</label>
                    <input 
                      type="email" 
                      className={`form-control ${inputBgClass} font-monospace`}
                      placeholder="ejemplo@correo.com"
                      value={datosEmail.nuevo}
                      onChange={(e) => setDatosEmail({ ...datosEmail, nuevo: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={cargandoEmail}
                    className="btn w-100 py-2 fw-bold text-white shadow" 
                    style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
                  >
                    {cargandoEmail ? 'Actualizando...' : 'Guardar Nuevo Email'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: Respaldo y Restauración Contingente */}
        <div className="col-12 col-lg-7">
          <div className="p-4 rounded-4 shadow h-100" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1 text-info">
                  <i className="bi bi-hdd-network me-2"></i>Respaldo Local Contingente
                </h5>
                <p className={`${mutedTextColor} small mb-0`}>Generación y carga de datos para contingencias operativas</p>
              </div>
              <button 
                onClick={handleGenerarRespaldo}
                disabled={cargandoRespaldo}
                className="btn btn-info fw-bold text-dark px-3 shadow"
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-download me-2"></i>
                {cargandoRespaldo ? 'Generando...' : 'Generar Respaldo Ahora'}
              </button>
            </div>

            {mensajeRespaldo && (
              <div className={`alert ${mensajeRespaldo.tipo === 'error' ? 'alert-danger bg-danger text-white' : 'alert-success bg-success text-white'} border-0 py-2 small fw-bold mb-3`}>
                <i className={`bi ${mensajeRespaldo.tipo === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'} me-2`}></i>
                {mensajeRespaldo.texto}
              </div>
            )}

            <div className="p-3 mb-4 rounded border border-secondary" style={{ backgroundColor: subBg }}>
              <h6 className="fw-bold text-warning mb-2 small">
                <i className="bi bi-upload me-2"></i>Cargar / Restaurar Copia de Seguridad JSON
              </h6>
              <form onSubmit={handleRestaurarRespaldoClick} className="d-flex gap-2">
                <input 
                  type="file" 
                  accept=".json"
                  className={`form-control form-control-sm ${inputBgClass} font-monospace`}
                  onChange={(e) => setArchivoSeleccionado(e.target.files ? e.target.files[0] : null)}
                />
                <button 
                  type="submit" 
                  disabled={cargandoRestaurar || !archivoSeleccionado}
                  className="btn btn-warning btn-sm fw-bold text-dark text-nowrap px-3"
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  {cargandoRestaurar ? 'Cargando...' : 'Restaurar Datos'}
                </button>
              </form>
            </div>

            <div className="mt-3">
              <h6 className={`fw-bold ${mutedTextColor} mb-3 small`}>Historial de Respaldos Generados</h6>
              
              <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '280px' }}>
                <table className={`table ${esOscuro ? 'table-dark' : 'table-light'} table-hover mb-0 align-middle small`}>
                  <thead style={{ backgroundColor: esOscuro ? '#27272a' : '#e4e4e7' }}>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Archivo</th>
                      <th>Tamaño</th>
                      <th>Operador</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialRespaldos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`text-center py-4 ${mutedTextColor}`}>
                          No hay respaldos registrados en el sistema.
                        </td>
                      </tr>
                    ) : (
                      historialRespaldos.map((resp) => (
                        <tr key={resp.idRespaldo}>
                          <td>{new Date(resp.fechaHora).toLocaleString('es-AR')}</td>
                          <td className="text-info">{resp.nombreArchivo}</td>
                          <td><span className="badge bg-secondary">{resp.tamanio}</span></td>
                          <td><b>@{resp.usuarioOperador}</b></td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button 
                                onClick={() => handleDescargarRespaldoHistorial(resp.idRespaldo, resp.nombreArchivo)}
                                className="btn btn-outline-info btn-sm"
                                title="Descargar"
                              >
                                <i className="bi bi-download"></i>
                              </button>
                              <button 
                                onClick={() => handleEliminarRespaldo(resp.idRespaldo)}
                                className="btn btn-outline-danger btn-sm"
                                title="Eliminar"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL RESTAURAR */}
      {mostrarModalConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content text-center p-4 shadow-lg" style={{ backgroundColor: cardBg, border: '1px solid #a855f7', borderRadius: '16px' }}>
              <div className="mb-3 text-warning">
                <i className="bi bi-exclamation-triangle fs-1" style={{ color: '#facc15' }}></i>
              </div>
              <h5 className="fw-bold mb-2" style={{ color: textColor, fontSize: '1.25rem' }}>¿Actualizar/Restaurar Datos?</h5>
              <p className={`${mutedTextColor} small mb-4 px-2`}>
                ¡ATENCIÓN! La restauración sobrescribirá los datos existentes. ¿Deseas continuar?
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button type="button" className="btn px-4 fw-semibold text-white" style={{ backgroundColor: '#168616', borderRadius: '8px' }} onClick={() => setMostrarModalConfirmacion(false)}>Volver</button>
                <button type="button" className="btn px-4 fw-semibold text-white" style={{ backgroundColor: '#e61111', borderRadius: '8px' }} onClick={ejecutarRestauracion}>Sí, Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};