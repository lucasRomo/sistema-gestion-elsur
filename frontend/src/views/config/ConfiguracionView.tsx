import React, { useState, useEffect } from 'react';

interface RespaldoLog {
  idRespaldo: number;
  fechaHora: string;
  nombreArchivo: string;
  tamanio: string;
  usuarioOperador: string;
  tipo: string;
}

export const ConfiguracionView: React.FC = () => {
  // Estado para Cambio de Contraseña
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mensajePass, setMensajePass] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);
  const [cargandoPass, setCargandoPass] = useState(false);

  // Estado para Respaldo Local Contingente
  const [historialRespaldos, setHistorialRespaldos] = useState<RespaldoLog[]>([]);
  const [cargandoRespaldo, setCargandoRespaldo] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState<{ texto: string; tipo: 'error' | 'exito' } | null>(null);

  // Estado para Cargar / Restaurar Respaldo
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [cargandoRestaurar, setCargandoRestaurar] = useState(false);

  const usuarioGuardado = localStorage.getItem('usuario_logueado');
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const token = localStorage.getItem('token');

  useEffect(() => {
    cargarHistorialRespaldos();
  }, []);

  const cargarHistorialRespaldos = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/respaldos/historial', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

    if (!passwords.nueva || !passwords.confirmar) {
      setMensajePass({ texto: 'Por favor completa todos los campos requeridos.', tipo: 'error' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMensajePass({ texto: 'Las nuevas contraseñas no coinciden.', tipo: 'error' });
      return;
    }
    if (passwords.nueva.length < 4) {
      setMensajePass({ texto: 'La contraseña debe tener al menos 4 caracteres.', tipo: 'error' });
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
        setMensajePass({ texto: 'Error al cambiar la contraseña en el servidor.', tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensajePass({ texto: 'Error de conexión con el backend (Puerto 8080).', tipo: 'error' });
    } finally {
      setCargandoPass(false);
    }
  };

  const handleGenerarRespaldo = async () => {
    setCargandoRespaldo(true);
    setMensajeRespaldo(null);

    try {
      const usuarioNombre = usuario?.nombreUsuario || 'Operario';
      const response = await fetch(`http://localhost:8080/api/respaldos/generar?usuario=${encodeURIComponent(usuarioNombre)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Error al descargar respaldo");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_elsur_contingencia_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMensajeRespaldo({ texto: 'Respaldo local descargado correctamente.', tipo: 'exito' });
      cargarHistorialRespaldos();
    } catch (error) {
      console.error(error);
      setMensajeRespaldo({ texto: 'No se pudo generar el respaldo contingente.', tipo: 'error' });
    } finally {
      setCargandoRespaldo(false);
    }
  };

  const handleDescargarRespaldoHistorial = async (idRespaldo: number, nombreArchivo: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/respaldos/descargar/${idRespaldo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Error al descargar el archivo");

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
      console.error(error);
      alert("No se pudo descargar el archivo de respaldo seleccionado.");
    }
  };

  const handleEliminarRespaldo = async (idRespaldo: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este respaldo del historial y del servidor?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/respaldos/${idRespaldo}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMensajeRespaldo({ texto: 'Respaldo eliminado del historial con éxito.', tipo: 'exito' });
        cargarHistorialRespaldos();
      } else {
        setMensajeRespaldo({ texto: 'No se pudo eliminar el respaldo del servidor.', tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensajeRespaldo({ texto: 'Error al intentar eliminar el respaldo.', tipo: 'error' });
    }
  };

  const handleRestaurarRespaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoSeleccionado) {
      setMensajeRespaldo({ texto: 'Por favor selecciona un archivo JSON de respaldo.', tipo: 'error' });
      return;
    }

    if (!window.confirm("¡ATENCIÓN! La restauración sobrescribirá/actualizará los datos existentes con la copia cargada. ¿Deseas continuar?")) {
      return;
    }

    setCargandoRestaurar(true);
    setMensajeRespaldo(null);

    const formData = new FormData();
    formData.append('archivo', archivoSeleccionado);

    try {
      const response = await fetch('http://localhost:8080/api/respaldos/restaurar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMensajeRespaldo({ texto: '¡Base de datos restaurada con éxito desde el archivo seleccionado!', tipo: 'exito' });
        setArchivoSeleccionado(null);
      } else {
        const errorText = await response.text();
        setMensajeRespaldo({ texto: `Error al restaurar: ${errorText}`, tipo: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMensajeRespaldo({ texto: 'Error de conexión al restaurar el respaldo.', tipo: 'error' });
    } finally {
      setCargandoRestaurar(false);
    }
  };

  return (
    <div className="container-fluid text-white font-monospace pb-5">
      <div className="mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
        <h2 className="fw-bold mb-1"><i className="bi bi-gear-fill me-2 text-info"></i>Configuración y Respaldo</h2>
        <p className="text-white-50 mb-0 small">Administración de credenciales personales y contingencia de datos para mostrador</p>
      </div>

      <div className="row g-4 mt-2">
        {/* COLUMNA 1: Cambiar Contraseña */}
        <div className="col-12 col-lg-5">
          <div className="p-4 rounded-4 shadow h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded" style={{ backgroundColor: '#222122', borderLeft: '4px solid #8e45e0' }}>
              <i className="bi bi-person-bounding-box fs-3" style={{ color: '#8e45e0' }}></i>
              <div>
                <h6 className="mb-0 fw-bold">{usuario?.persona?.nombre} {usuario?.persona?.apellido}</h6>
                <span className="text-white-50 small">Usuario: <b>@{usuario?.nombreUsuario}</b></span>
              </div>
            </div>

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
                disabled={cargandoPass}
                className="btn w-100 py-2 fw-bold text-white shadow" 
                style={{ backgroundColor: '#8e45e0', borderRadius: '8px' }}
              >
                {cargandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA 2: Respaldo y Restauración Contingente */}
        <div className="col-12 col-lg-7">
          <div className="p-4 rounded-4 shadow h-100" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1 text-info">
                  <i className="bi bi-hdd-network me-2"></i>Respaldo Local Contingente
                </h5>
                <p className="text-white-50 small mb-0">Generación y carga de datos para contingencias operativas</p>
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

            {/* SECCIÓN CARGAR / RESTAURAR RESPALDO */}
            <div className="p-3 mb-4 rounded border border-secondary" style={{ backgroundColor: '#222122' }}>
              <h6 className="fw-bold text-warning mb-2 small">
                <i className="bi bi-upload me-2"></i>Cargar / Restaurar Copia de Seguridad JSON
              </h6>
              <form onSubmit={handleRestaurarRespaldo} className="d-flex gap-2">
                <input 
                  type="file" 
                  accept=".json"
                  className="form-control form-control-sm bg-dark text-white border-secondary font-monospace"
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

            {/* HISTORIAL DE RESPALDOS */}
            <div className="mt-3">
              <h6 className="fw-bold text-white-50 mb-3 small">Historial de Respaldos Generados</h6>
              
              <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '280px' }}>
                <table className="table table-dark table-hover mb-0 align-middle small">
                  <thead style={{ backgroundColor: '#27272a' }}>
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
                        <td colSpan={5} className="text-center py-4 text-white-50">
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
                           title="Descargar este respaldo">
                           <i className="bi bi-download"></i>
                          </button>
                          <button 
                           onClick={() => handleEliminarRespaldo(resp.idRespaldo)}
                           className="btn btn-outline-danger btn-sm"
                           title="Eliminar respaldo">
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
    </div>
  );
};