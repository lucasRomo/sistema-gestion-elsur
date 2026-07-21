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
}

export const MatrizPermisosView: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number>(2); 
  const [modulos, setModulos] = useState<ModuloPermiso[]>([]);
  
  // Estados para la gestión de usuarios y asignación
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | ''>('');
  const [mostrarSeccionAsignacion, setMostrarSeccionAsignacion] = useState<boolean>(false);

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState<boolean>(false);
  const [mostrarModalExito, setMostrarModalExito] = useState<boolean>(false);
  const [mensajeExitoTexto, setMensajeExitoTexto] = useState<string>('¡Guardado exitosamente!');
  
  // Estados para crear un nuevo rol
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
        setRoles(rolesData);
        
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
    const fetchPermisosDelRol = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/permisos/rol/${rolSeleccionado}`);
        if (res.ok) {
          const idsActivos: number[] = await res.json(); 
          setModulos(prev => prev.map(mod => ({
            ...mod,
            activo: idsActivos.includes(mod.idPermiso)
          })));
        }
      } catch (error) {
        console.error("Error al traer permisos activos", error);
      }
    };

    if (rolSeleccionado && modulos.length > 0) {
      fetchPermisosDelRol();
    }
  }, [rolSeleccionado]);

  const togglePermiso = (id: number) => {
    setModulos(modulos.map(mod => mod.idPermiso === id ? { ...mod, activo: !mod.activo } : mod));
  };

  const handleGuardar = () => setMostrarModalConfirmacion(true);

  const confirmarGuardado = async () => {
    setMostrarModalConfirmacion(false);
    const permisosActivosIds = modulos.filter(m => m.activo).map(m => m.idPermiso);

    try {
      const res = await fetch(`http://localhost:8080/api/permisos/rol/${rolSeleccionado}/actualizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permisosActivosIds)
      });
      if (res.ok) {
        setMensajeExitoTexto('¡Permisos actualizados correctamente!');
        setMostrarModalExito(true);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  const handleCrearRol = async () => {
    if (!nuevoRolNombre.trim()) return alert("El nombre no puede estar vacío");
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
      alert("Error al crear el perfil");
    }
  };

  const handleEliminarRol = async () => {
    if (rolSeleccionado === 1 || rolSeleccionado === 2) {
      alert("No se pueden eliminar los perfiles principales del sistema.");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar este perfil? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/permisos/roles/${rolSeleccionado}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert("Perfil eliminado con éxito.");
        await fetchInicial();
        setRolSeleccionado(1); 
      } else {
        const errorData = await res.json();
        alert(errorData.error || "No se pudo eliminar el perfil.");
      }
    } catch (error) {
      alert("Error de conexión al intentar eliminar el perfil.");
    }
  };

  // Función para asignar el rol actual a un empleado seleccionado
  const handleAsignarRolAEmpleado = async () => {
    if (!usuarioSeleccionado) {
      alert("Por favor selecciona un empleado de la lista.");
      return;
    }

    const usuarioObj = usuarios.find(u => u.idUsuario === Number(usuarioSeleccionado));
    if (!usuarioObj) return;

    // Estructura requerida por UsuarioController (PUT /api/usuarios/{id})
    const usuarioActualizado = {
      ...usuarioObj,
      rol: {
        idRol: rolSeleccionado
      }
    };

    try {
      const res = await fetch(`http://localhost:8080/api/usuarios/${usuarioSeleccionado}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioActualizado)
      });

      if (res.ok) {
        setMensajeExitoTexto('¡Perfil asignado al empleado correctamente!');
        setMostrarModalExito(true);
        await fetchInicial(); // Recargar usuarios
        setUsuarioSeleccionado('');
      } else {
        alert("No se pudo actualizar el rol del usuario.");
      }
    } catch (error) {
      alert("Error de conexión al asignar el rol.");
    }
  };

  const rolActualObj = roles.find(r => r.idRol === rolSeleccionado);

  return (
    <div className="container-fluid text-white font-monospace py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#ffffff' }}>Matriz de Permisos por Perfil</h2>
          <p className="text-white-50 mb-0 small">Configuración dinámica de acceso a ventanas y asignación de personal</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button 
            onClick={() => setMostrarModalNuevoRol(true)}
            className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
            style={{ backgroundColor: '#2b7a3e', border: '1px solid #20c997' }}
          >
            <i className="bi bi-plus-lg"></i> Nuevo Perfil
          </button>

          {rolSeleccionado > 2 && (
            <button 
              onClick={handleEliminarRol}
              className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
              style={{ backgroundColor: '#a52a2a', border: '1px solid #dc3545' }}
              title="Eliminar perfil seleccionado"
            >
              <i className="bi bi-trash"></i> Eliminar
            </button>
          )}

          <select 
            className="form-select bg-dark text-white fw-bold px-3 py-2" 
            style={{ border: '1px solid #8e45e0', borderRadius: '8px', width: '220px', cursor: 'pointer' }}
            value={rolSeleccionado}
            onChange={(e) => setRolSeleccionado(Number(e.target.value))}
          >
            {roles.map(rol => (
              <option key={rol.idRol} value={rol.idRol}>PERFIL: {rol.nombreRol}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', maxWidth: '850px', margin: '0 auto' }}>
        
        {/* PANEL DESPLEGABLE DE ASIGNACIÓN DE EMPLEADOS */}
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#222122', border: '1px solid #3f3f46' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold small text-white-50">
              <i className="bi bi-person-badge me-2 text-warning"></i>
              Asignación rápida de este perfil ({rolActualObj?.nombreRol || 'Seleccionado'}) a Empleados
            </span>
            <button 
              onClick={() => setMostrarSeccionAsignacion(!mostrarSeccionAsignacion)}
              className="btn btn-sm text-white fw-bold"
              style={{ backgroundColor: '#8e45e0', fontSize: '0.8rem' }}
            >
              {mostrarSeccionAsignacion ? 'Ocultar Asignación' : 'Asignar a Empleado'}
            </button>
          </div>

          {mostrarSeccionAsignacion && (
            <div className="mt-3 pt-3 border-top border-secondary animate__animated animate__fadeIn">
              <div className="row g-2 align-items-center">
                <div className="col-md-8">
                  <select
                    className="form-select bg-dark text-white small"
                    style={{ border: '1px solid #3f3f46' }}
                    value={usuarioSeleccionado}
                    onChange={(e) => setUsuarioSeleccionado(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Seleccione un Empleado / Usuario --</option>
                    {usuarios.map(u => (
                      <option key={u.idUsuario} value={u.idUsuario}>
                        {u.persona ? `${u.persona.nombre} ${u.persona.apellido}` : u.nombreUsuario} 
                        {u.rol ? ` (Rol actual: ${u.rol.nombreRol})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <button 
                    onClick={handleAsignarRolAEmpleado}
                    className="btn w-100 btn-sm text-white fw-bold py-2"
                    style={{ backgroundColor: '#2b7a3e', border: '1px solid #20c997' }}
                  >
                    Confirmar Asignación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <h5 className="text-center fw-bold mb-4 py-2 rounded" style={{ backgroundColor: '#222122', border: '1px solid #2d2d30', color: '#8e45e0' }}>
          Ventanas que el perfil seleccionado tiene permitido ingresar
        </h5>

        <div className="px-3 py-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {modulos.map((mod) => (
            <div 
              key={mod.idPermiso} 
              onClick={() => togglePermiso(mod.idPermiso)}
              className="d-flex justify-content-between align-items-center p-3 mb-2 rounded transition-all"
              style={{ 
                backgroundColor: mod.activo ? 'rgba(142, 69, 224, 0.05)' : '#222122', 
                border: mod.activo ? '1px solid #8e45e0' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>{mod.nombrePermiso}</span>
              <span 
                className="badge px-3 py-2 fw-bold" 
                style={{ 
                  backgroundColor: mod.activo ? 'rgba(25, 135, 84, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                  color: mod.activo ? '#20c997' : '#ff6b6b',
                  border: mod.activo ? '1px solid #198754' : '1px solid #dc3545',
                  letterSpacing: '1px'
                }}
              >
                {mod.activo ? 'ACTIVO' : 'DESACTIVADO'}
              </span>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top border-secondary" style={{ borderColor: '#2d2d30 !important' }}>
          <button onClick={() => navigate('/dashboard')} className="btn px-4 py-2 fw-bold text-white" style={{ backgroundColor: '#a52a2a', borderRadius: '8px' }}>Volver</button>
          <button onClick={handleGuardar} className="btn px-5 py-2 fw-bold text-white shadow" style={{ backgroundColor: '#2b7a3e', borderRadius: '8px' }}>Guardar Cambios</button>
        </div>
      </div>

      {/* MODAL CREAR NUEVO ROL */}
      {mostrarModalNuevoRol && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white p-4" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '16px' }}>
              <h4 className="fw-bold mb-3 text-center" style={{ color: '#8e45e0' }}>Crear Nuevo Perfil</h4>
              <div className="mb-4">
                <label className="text-white-50 mb-2">Nombre del Perfil (Ej: CAJERO, SUPERVISOR)</label>
                <input 
                  type="text" 
                  className="form-control bg-dark text-white" 
                  style={{ border: '1px solid #3f3f46' }}
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="Escriba aquí..."
                />
              </div>
              <div className="d-flex justify-content-between gap-3">
                <button className="btn w-50 fw-bold text-white" style={{ backgroundColor: '#a52a2a' }} onClick={() => setMostrarModalNuevoRol(false)}>Cancelar</button>
                <button className="btn w-50 fw-bold text-white" style={{ backgroundColor: '#2b7a3e' }} onClick={handleCrearRol}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModalConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white font-monospace p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '16px' }}>
              <div className="modal-body text-center py-4">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
                <h4 className="mt-3 fw-bold">¡Atención!</h4>
                <p className="text-white-50 mt-2">Estás a punto de modificar los permisos de este perfil.</p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button className="btn px-4 py-2 fw-bold text-white w-50" style={{ backgroundColor: '#a52a2a' }} onClick={() => setMostrarModalConfirmacion(false)}>Cancelar</button>
                  <button className="btn px-4 py-2 fw-bold text-white w-50" style={{ backgroundColor: '#2b7a3e' }} onClick={confirmarGuardado}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white font-monospace p-3" style={{ backgroundColor: '#18181b', border: '1px solid #20c997', borderRadius: '16px' }}>
              <div className="modal-body text-center py-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3.5rem' }}></i>
                <h4 className="mt-3 fw-bold">{mensajeExitoTexto}</h4>
                <button className="btn px-5 py-2 fw-bold text-white mt-3" style={{ backgroundColor: '#a52a2a' }} onClick={() => setMostrarModalExito(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};