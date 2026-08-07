import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

interface ModuloPermiso {
  idPermiso: number;
  nombrePermiso: string;
  activo: boolean;
}

interface Usuario {
  idUsuario: number;
  nombreUsuario: string;
  persona?: {
    nombre: string;
    apellido: string;
    email?: string;
  };
  rol?: {
    idRol: number;
    nombreRol: string;
  };
  tienePermisosPersonalizados?: boolean;
}

const CATEGORIAS_SIDEBAR: { [categoria: string]: string[] } = {
  'GENERAL': ['Panel Principal'],
  'PRODUCCIÓN': ['Crear Pedido', 'Pedidos Pendientes', 'Historial de Pedidos', 'Caja', 'Repositorio Digital'],
  'STOCK': ['Inventario', 'Insumos', 'Productos'],
  'ADMINISTRACIÓN / ENTIDADES': ['Clientes', 'Proveedores'],
  'OPCIONES DE GERENTE': ['Informes', 'Matriz de Permisos', 'Gestión de Usuarios', 'Historial de Actividad'],
  'MI CUENTA': ['Configuración']
};

export const MatrizPermisosView: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number>(2); 
  const [modulos, setModulos] = useState<ModuloPermiso[]>([]);
  
  const [rolSeleccionadoEnUsuario, setRolSeleccionadoEnUsuario] = useState<number | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState<string>('');
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  // Modales
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState<boolean>(false);
  const [mostrarModalExito, setMostrarModalExito] = useState<boolean>(false);
  const [mensajeExitoTexto, setMensajeExitoTexto] = useState<string>('¡Guardado exitosamente!');
  
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState<boolean>(false);
  const [mensajeBloqueoTexto, setMensajeBloqueoTexto] = useState<string>('');

  const [mostrarModalNuevoRol, setMostrarModalNuevoRol] = useState<boolean>(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState<string>('');

  const fetchInicial = async () => {
    try {
      const [rolesRes, permisosRes, usuariosRes] = await Promise.all([
        fetch('http://localhost:8080/api/permisos/roles'),
        fetch('http://localhost:8080/api/permisos'),
        fetch('http://localhost:8080/api/usuarios')
      ]);
      
      if (rolesRes.ok && permisosRes.ok) {
        const rolesData = await rolesRes.json();
        const permisosData = await permisosRes.json();

        const rolesGlobales = rolesData.filter((r: any) => !r.nombreRol.startsWith('PERFIL_'));
        setRoles(rolesGlobales);
        
        const permisosBase = permisosData.map((p: any) => ({
          idPermiso: p.idPermiso,
          nombrePermiso: p.nombrePermiso,
          activo: false
        }));
        setModulos(permisosBase);
      }

      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        setUsuarios(usuariosData);
      }
    } catch (error) {
      console.error("Error trayendo datos iniciales", error);
    }
  };

  useEffect(() => {
    fetchInicial();
  }, []);

  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        let idRolAConsultar = rolSeleccionado;

        if (usuarioEditar) {
          if (rolSeleccionadoEnUsuario !== null) {
            idRolAConsultar = rolSeleccionadoEnUsuario;
          } else if (usuarioEditar.rol?.idRol) {
            idRolAConsultar = usuarioEditar.rol.idRol;
          } else {
            return;
          }
        }

        const res = await fetch(`http://localhost:8080/api/permisos/rol/${idRolAConsultar}`);
        if (res.ok) {
          const idsActivos: number[] = await res.json(); 
          
          setModulos(prev => prev.map(mod => {
            const esProtegido = usuarioEditar?.idUsuario === 1 && 
              ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'].includes(mod.nombrePermiso);

            return {
              ...mod,
              activo: esProtegido ? true : idsActivos.includes(mod.idPermiso)
            };
          }));
        }
      } catch (error) {
        console.error("Error al traer permisos activos", error);
      }
    };

    if (modulos.length > 0) {
      fetchPermisos();
    }
  }, [rolSeleccionado, usuarioEditar, rolSeleccionadoEnUsuario]);

  const handleCambioPerfilSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoRolId = Number(e.target.value);

    if (usuarioEditar?.idUsuario === 1) {
      setMensajeBloqueoTexto("El Administrador Principal no puede cambiar su perfil global para evitar bloqueos del sistema.");
      setMostrarModalBloqueo(true);
      return;
    }

    setRolSeleccionado(nuevoRolId);

    if (usuarioEditar) {
      setRolSeleccionadoEnUsuario(nuevoRolId);
    }
  };

  const esPermisoProtegido = (nombrePermiso: string) => {
    if (usuarioEditar?.idUsuario !== 1) return false;
    const permisosProtegidos = ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'];
    return permisosProtegidos.includes(nombrePermiso);
  };

  const togglePermiso = (id: number, nombrePermiso: string) => {
    if (esPermisoProtegido(nombrePermiso)) {
      setMensajeBloqueoTexto("Este permiso está protegido para el Administrador Principal y no se puede desactivar.");
      setMostrarModalBloqueo(true);
      return;
    }

    setModulos(modulos.map(mod => mod.idPermiso === id ? { ...mod, activo: !mod.activo } : mod));
  };

  const seleccionarUsuarioParaPermisos = (u: Usuario) => {
    setUsuarioEditar(u);
    setRolSeleccionadoEnUsuario(null);
  };

  const volverAModoGlobal = () => {
    setUsuarioEditar(null);
    setRolSeleccionadoEnUsuario(null);
  };

  const handleGuardar = () => setMostrarModalConfirmacion(true);

  const confirmarGuardado = async () => {
    setMostrarModalConfirmacion(false);

    const modulosAsegurados = modulos.map(mod => {
      if (usuarioEditar?.idUsuario === 1 && esPermisoProtegido(mod.nombrePermiso)) {
        return { ...mod, activo: true };
      }
      return mod;
    });

    const permisosActivosIds = modulosAsegurados.filter(m => m.activo).map(m => m.idPermiso);

    try {
      if (usuarioEditar) {
        if (rolSeleccionadoEnUsuario !== null && usuarioEditar.idUsuario !== 1) {
          await fetch(`http://localhost:8080/api/usuarios/${usuarioEditar.idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...usuarioEditar,
              rol: { idRol: rolSeleccionadoEnUsuario }
            })
          });

          setMensajeExitoTexto(`¡Se asignó el perfil global a ${usuarioEditar.nombreUsuario}!`);
        } 
        else {
          let idRolDestino = usuarioEditar.rol?.idRol;

          if (!usuarioEditar.rol?.nombreRol.startsWith('PERFIL_')) {
            const nombreNuevoPerfil = `PERFIL_${usuarioEditar.nombreUsuario.toUpperCase()}`;
            
            const rolRes = await fetch('http://localhost:8080/api/permisos/roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombreRol: nombreNuevoPerfil })
            });

            if (rolRes.ok) {
              const rolCreado = await rolRes.json();
              idRolDestino = rolCreado.idRol;

              await fetch(`http://localhost:8080/api/usuarios/${usuarioEditar.idUsuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...usuarioEditar,
                  rol: { idRol: idRolDestino }
                })
              });
            }
          }

          if (idRolDestino) {
            await fetch(`http://localhost:8080/api/permisos/rol/${idRolDestino}/actualizar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(permisosActivosIds)
            });
          }

          setMensajeExitoTexto(`¡Permisos personalizados de ${usuarioEditar.nombreUsuario} actualizados!`);
        }
      } else {
        await fetch(`http://localhost:8080/api/permisos/rol/${rolSeleccionado}/actualizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permisosActivosIds)
        });

        setMensajeExitoTexto('¡Permisos de perfil global actualizados!');
      }

      setRolSeleccionadoEnUsuario(null);
      setMostrarModalExito(true);
      await fetchInicial();
    } catch (error) {
      console.error(error);
      setMensajeBloqueoTexto("Error de conexión al guardar los datos");
      setMostrarModalBloqueo(true);
    }
  };

  const handleCrearRol = async () => {
    if (!nuevoRolNombre.trim()) {
      setMensajeBloqueoTexto("El nombre no puede estar vacío");
      setMostrarModalBloqueo(true);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/api/permisos/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreRol: nuevoRolNombre.toUpperCase() })
      });
      if (res.ok) {
        const rolCreado = await res.json();
        await fetchInicial(); 
        setRolSeleccionado(rolCreado.idRol); 
        setMostrarModalNuevoRol(false);
        setNuevoRolNombre('');
      }
    } catch (error) {
      setMensajeBloqueoTexto("Error al crear el perfil");
      setMostrarModalBloqueo(true);
    }
  };

  const handleEliminarRol = async () => {
    if (rolSeleccionado === 1 || rolSeleccionado === 2) {
      setMensajeBloqueoTexto("No se pueden eliminar los perfiles principales del sistema.");
      setMostrarModalBloqueo(true);
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar este perfil? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/permisos/roles/${rolSeleccionado}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setMensajeExitoTexto("Perfil eliminado con éxito.");
        setMostrarModalExito(true);
        await fetchInicial();
        setRolSeleccionado(1); 
      } else {
        const errorData = await res.json();
        setMensajeBloqueoTexto(errorData.error || "No se pudo eliminar el perfil.");
        setMostrarModalBloqueo(true);
      }
    } catch (error) {
      setMensajeBloqueoTexto("Error de conexión al intentar eliminar el perfil.");
      setMostrarModalBloqueo(true);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const completo = `${u.persona?.nombre || ''} ${u.persona?.apellido || ''} ${u.nombreUsuario}`.toLowerCase();
    return completo.includes(busquedaUsuario.toLowerCase());
  });

  return (
    <div className="container-fluid py-2 px-3 matriz-container">
      {/* HEADER COMPACTO */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
        <div style={{ width: '335px' }}></div>
        <div className="text-center">
          <h3 className="fw-bold mb-0 text-body" style={{ fontSize: '1.8rem' }}>Matriz de Permisos por Perfil</h3>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <button 
            onClick={() => setMostrarModalNuevoRol(true)}
            className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 matriz-btn-nuevo"
            style={{ fontSize: '0.8rem' }}
          >
            <i className="bi bi-plus-lg"></i> Nuevo Perfil
          </button>

          {!usuarioEditar && rolSeleccionado > 2 && (
            <button 
              onClick={handleEliminarRol}
              className="btn btn-sm btn-danger fw-bold d-flex align-items-center gap-1"
              style={{ fontSize: '0.8rem' }}
              title="Eliminar perfil seleccionado"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}

          <select 
            className="form-select form-select-sm fw-bold px-2 py-1 im-surface border-info text-body matriz-select-perfil" 
            style={{ 
              width: '200px', 
              fontSize: '0.8rem',
              cursor: usuarioEditar?.idUsuario === 1 ? 'not-allowed' : 'pointer',
              opacity: usuarioEditar?.idUsuario === 1 ? 0.6 : 1 
            }}
            value={rolSeleccionado}
            onChange={handleCambioPerfilSelect}
            disabled={usuarioEditar?.idUsuario === 1}
          >
            {roles.map(rol => (
              <option key={rol.idRol} value={rol.idRol}>PERFIL: {rol.nombreRol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3">
        {/* PANEL IZQUIERDO: LISTA DE USUARIOS */}
        <div className="col-md-3">
          <div className="p-3 rounded-4 im-surface border border-secondary border-opacity-25 matriz-card-bg">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0 text-body small">
                <i className="bi bi-people-fill text-warning me-2"></i>Usuarios
              </h6>
              <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{usuarios.length}</span>
            </div>

            <div className="mb-2">
              <input 
                type="text" 
                className="form-control form-control-sm im-surface text-body border-secondary border-opacity-25"
                style={{ fontSize: '0.75rem' }}
                placeholder="Buscar..."
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
              />
            </div>

            <div className="d-flex flex-column gap-1" style={{ maxHeight: '560px', overflowY: 'auto' }}>
              {usuariosFiltrados.map(u => {
                const esSeleccionado = usuarioEditar?.idUsuario === u.idUsuario;
                const iniciales = u.persona 
                  ? `${u.persona.nombre[0]}${u.persona.apellido[0]}`.toUpperCase()
                  : u.nombreUsuario.substring(0, 2).toUpperCase();

                const nombreRolMostrar = (u.rol?.nombreRol.startsWith('PERFIL_') || u.tienePermisosPersonalizados)
                  ? 'PERSONALIZADO' 
                  : (u.rol?.nombreRol || 'SIN ROL');

                return (
                  <div 
                    key={u.idUsuario}
                    className={`p-2 rounded d-flex justify-content-between align-items-center matriz-user-item ${esSeleccionado ? 'selected border-info bg-info bg-opacity-10' : 'im-surface border-secondary border-opacity-25'}`}
                    style={{ border: '1px solid' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-info matriz-avatar"
                        style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}
                      >
                        {iniciales}
                      </div>
                      <div style={{ lineHeight: '1.1' }}>
                        <p className="mb-0 fw-bold text-body" style={{ fontSize: '0.75rem' }}>
                          {u.persona ? `${u.persona.nombre} ${u.persona.apellido}` : u.nombreUsuario}
                        </p>
                        <span className="text-body-secondary" style={{ fontSize: '0.65rem' }}>
                          @{u.nombreUsuario}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <span 
  className="badge bg-body-tertiary border border-secondary border-opacity-25 matriz-user-badge"
  style={{ fontSize: '0.6rem', padding: '3px 5px' }}
>
  {nombreRolMostrar}
</span>
                      <button 
                        onClick={() => seleccionarUsuarioParaPermisos(u)}
                        className={`btn btn-sm p-0 px-1 ${esSeleccionado ? 'btn-info text-white' : 'btn-outline-info'}`}
                        style={{ fontSize: '0.7rem' }}
                        title="Configurar permisos"
                      >
                        <i className="bi bi-sliders"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: MATRIZ CON ESPACIEDO OPTIMIZADO */}
        <div className="col-md-9">
          <div className="p-3 rounded-4 im-surface border border-secondary border-opacity-25 matriz-card-bg">
            
            {usuarioEditar ? (
              <div className="p-2 px-3 mb-3 rounded d-flex justify-content-between align-items-center bg-success bg-opacity-10 border border-success border-opacity-25">
                <div>
                  <span className="badge bg-success mb-0 me-2" style={{ fontSize: '0.7rem' }}>EMPLEADO</span>
                  <span className="fw-bold text-body">
                    Permisos de: <span className="text-success">"{usuarioEditar.persona ? `${usuarioEditar.persona.nombre} ${usuarioEditar.persona.apellido}` : usuarioEditar.nombreUsuario}"</span>
                  </span>
                  {usuarioEditar.idUsuario === 1 && <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>ADMIN PRINCIPAL</span>}
                </div>
                <button onClick={volverAModoGlobal} className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-x-circle me-1"></i> Volver a Perfiles Globales
                </button>
              </div>
            ) : (
              <div className="p-2 px-3 mb-3 rounded im-surface border border-info border-opacity-50 matriz-banner-global">
                <span className="badge bg-info text-dark me-2 matriz-badge-perfil-global" style={{ fontSize: '0.7rem' }}>PERFIL GLOBAL</span>
                <span className="fw-bold text-body">
                  Permisos del perfil: <span className="text-info matriz-text-accent">{roles.find(r => r.idRol === rolSeleccionado)?.nombreRol}</span>
                </span>
              </div>
            )}

            {/* CONTENEDOR MULTI-COLUMNA AMPLIA */}
            <div style={{ columnCount: 2, columnGap: '0.75rem' }}>
              {Object.entries(CATEGORIAS_SIDEBAR).map(([catNombre, ventanasList]) => {
                const modulosDeCategoria = modulos.filter(m => ventanasList.includes(m.nombrePermiso));
                if (modulosDeCategoria.length === 0) return null;

                return (
                  <div 
                    key={catNombre} 
                    className="p-2 px-3 rounded mb-3 im-surface border border-secondary border-opacity-25 matriz-cat-card" 
                    style={{ breakInside: 'avoid' }}
                  >
                    <h6 className="fw-bold text-body-secondary mb-2 border-bottom border-secondary border-opacity-25 pb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      — {catNombre}
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {modulosDeCategoria.map(mod => {
                        const bloqueado = esPermisoProtegido(mod.nombrePermiso);

                        return (
                          <div 
                            key={mod.idPermiso}
                            onClick={() => togglePermiso(mod.idPermiso, mod.nombrePermiso)}
                            className={`d-flex justify-content-between align-items-center px-3 py-2 rounded transition-all matriz-permiso-item ${mod.activo ? 'activo bg-info bg-opacity-10 border border-info border-opacity-25' : 'im-surface border border-secondary border-opacity-25'}`}
                            style={{ 
                              cursor: bloqueado ? 'not-allowed' : 'pointer',
                              opacity: bloqueado ? 0.75 : 1
                            }}
                          >
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-body" style={{ fontSize: '0.85rem' }}>{mod.nombrePermiso}</span>
                              {bloqueado && (
                                <i className="bi bi-lock-fill text-warning ms-1" style={{ fontSize: '0.8rem' }} title="Protegido para Administrador Principal"></i>
                              )}
                            </div>
                            <span 
                              className={`badge px-2 py-1 fw-bold ${mod.activo ? 'bg-success text-dark' : 'bg-danger text-white'}`} 
                              style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                            >
                              {mod.activo ? 'ACTIVO' : 'DESACTIVADO'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="d-flex justify-content-between mt-3 pt-2 border-top border-secondary border-opacity-25">
              <button 
  onClick={() => navigate('/dashboard')} 
  className="btn btn-sm btn-danger px-3 py-1 fw-bold matriz-btn-volver" 
  style={{ borderRadius: '6px', fontSize: '0.85rem' }}
>
  Volver
</button>
              <button onClick={handleGuardar} className="btn btn-sm btn-success px-4 py-1 fw-bold text-white shadow matriz-btn-guardar" style={{ borderRadius: '6px', fontSize: '0.85rem' }}>
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODALES */}
      {mostrarModalNuevoRol && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content im-surface text-body p-3 border border-info rounded-3 matriz-card-bg">
              <h5 className="fw-bold mb-3 text-center text-info matriz-text-accent" style={{ fontSize: '1rem' }}>Crear Nuevo Perfil Global</h5>
              <div className="mb-3">
                <label className="text-body-secondary mb-1 small" style={{ fontSize: '0.75rem' }}>Nombre del Perfil (Ej: CAJERO)</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm im-surface text-body border-secondary border-opacity-25" 
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="Escriba aquí..."
                />
              </div>
              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-sm btn-secondary w-50 fw-bold text-white matriz-btn-volver" onClick={() => setMostrarModalNuevoRol(false)}>Cancelar</button>
                <button className="btn btn-sm btn-success w-50 fw-bold text-white matriz-btn-guardar" onClick={handleCrearRol}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content im-surface text-body p-3 border border-warning rounded-3 matriz-card-bg">
              <div className="modal-body text-center py-2">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mt-2 fw-bold">¡Atención!</h5>
                <p className="text-body-secondary mt-1 small" style={{ fontSize: '0.75rem' }}>
                  {usuarioEditar 
                    ? `Estás modificando la configuración de permisos para ${usuarioEditar.nombreUsuario}.`
                    : `Estás modificando la plantilla del Perfil Global.`}
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button className="btn btn-sm btn-secondary px-3 fw-bold text-white w-50 matriz-btn-volver" onClick={() => setMostrarModalConfirmacion(false)}>Cancelar</button>
                  <button className="btn btn-sm btn-success px-3 fw-bold text-white w-50 matriz-btn-guardar" onClick={confirmarGuardado}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content im-surface text-body p-3 border border-success rounded-3 matriz-card-bg">
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10 border border-success" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-check-lg text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-body">{mensajeExitoTexto}</h6>
                <button className="btn btn-sm btn-secondary px-4 fw-bold text-white mt-2 matriz-btn-volver" style={{ borderRadius: '6px' }} onClick={() => setMostrarModalExito(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content im-surface text-body p-3 border border-warning rounded-3 matriz-card-bg">
              <div className="modal-body text-center py-2">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10 border border-warning" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-lock-fill text-warning" style={{ fontSize: '1.8rem' }}></i>
                  </div>
                </div>
                <p className="fw-bold mb-2 text-body px-1 small" style={{ fontSize: '0.8rem' }}>{mensajeBloqueoTexto}</p>
                <button className="btn btn-sm btn-secondary px-4 fw-bold text-white mt-1 matriz-btn-volver" style={{ borderRadius: '6px' }} onClick={() => setMostrarModalBloqueo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};