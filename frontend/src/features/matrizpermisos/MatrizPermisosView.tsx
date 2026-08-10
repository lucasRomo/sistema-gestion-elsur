import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Context/ThemeContext';

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

// CATEGORÍAS UNIFICADAS: Incluye 'Inventario' (Lisandro) y 'Equipos / Máquinas' (Lucas)
const CATEGORIAS_SIDEBAR: { [categoria: string]: string[] } = {
  'GENERAL': ['Panel Principal'],
  'PRODUCCIÓN': ['Crear Pedido', 'Pedidos Pendientes', 'Historial de Pedidos', 'Caja', 'Repositorio Digital'],
  'STOCK': ['Inventario', 'Insumos', 'Productos'],
  'ADMINISTRACIÓN / ENTIDADES': ['Clientes', 'Proveedores', 'Equipos / Máquinas'],
  'OPCIONES DE GERENTE': ['Informes', 'Matriz de Permisos', 'Gestión de Usuarios', 'Historial de Actividad'],
  'MI CUENTA': ['Configuración']
};

export const MatrizPermisosView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [roles, setRoles] = useState<any[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number>(1); 
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
          const esRolAdminActivo = idRolAConsultar === 1;

          setModulos(prev => prev.map(mod => {
            const esProtegido = (esRolAdminActivo || usuarioEditar?.idUsuario === 1) && 
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

    if (usuarioEditar) {
      setRolSeleccionadoEnUsuario(nuevoRolId);
    } else {
      setRolSeleccionado(nuevoRolId);
    }
  };

  const esPermisoProtegido = (nombrePermiso: string) => {
    const permisosProtegidos = ['Matriz de Permisos', 'Configuración', 'Gestión de Usuarios'];
    if (!permisosProtegidos.includes(nombrePermiso)) return false;

    if (usuarioEditar) {
      return usuarioEditar.idUsuario === 1 || usuarioEditar.rol?.idRol === 1 || rolSeleccionadoEnUsuario === 1;
    }

    return rolSeleccionado === 1;
  };

  const togglePermiso = (id: number, nombrePermiso: string) => {
    if (esPermisoProtegido(nombrePermiso)) {
      setMensajeBloqueoTexto("Este permiso está protegido para el Perfil Administrador y no se puede desactivar.");
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

    // Asegurar los permisos protegidos de Admin
    const modulosAsegurados = modulos.map(mod => {
      if (esPermisoProtegido(mod.nombrePermiso)) {
        return { ...mod, activo: true };
      }
      return mod;
    });

    const permisosActivos = modulosAsegurados.filter(m => m.activo).map(m => ({
      idPermiso: m.idPermiso,
      nombrePermiso: m.nombrePermiso
    }));

    const permisosActivosIds = modulosAsegurados.filter(m => m.activo).map(m => m.idPermiso);

    try {
      let idRolFinalAsignado: number | undefined;

      if (usuarioEditar) {
        // CASO 1: Reasignación de Rol Global al Usuario
        if (rolSeleccionadoEnUsuario !== null) {
          const rolObjeto = roles.find(r => r.idRol === rolSeleccionadoEnUsuario);

          const resUsuario = await fetch(`http://localhost:8080/api/usuarios/${usuarioEditar.idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...usuarioEditar,
              rol: { idRol: rolSeleccionadoEnUsuario }
            })
          });

          if (resUsuario.ok) {
            idRolFinalAsignado = rolSeleccionadoEnUsuario;
            
            const usuarioActualizado = {
              ...usuarioEditar,
              rol: rolObjeto || { idRol: rolSeleccionadoEnUsuario, nombreRol: 'ADMIN' },
              tienePermisosPersonalizados: false
            };
            setUsuarioEditar(usuarioActualizado);
            setMensajeExitoTexto(`¡Se asignó el perfil "${rolObjeto?.nombreRol || 'ADMIN'}" a ${usuarioEditar.nombreUsuario}!`);
          }
        } 
        // CASO 2: Edición de permisos personalizados del usuario
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
                  rol: { idRol: idRolDestino, nombreRol: nombreNuevoPerfil }
                })
              });

              setUsuarioEditar(prev => prev ? { ...prev, rol: { idRol: idRolDestino!, nombreRol: nombreNuevoPerfil }, tienePermisosPersonalizados: true } : null);
            }
          }

          if (idRolDestino) {
            await fetch(`http://localhost:8080/api/permisos/rol/${idRolDestino}/actualizar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(permisosActivosIds)
            });
            idRolFinalAsignado = idRolDestino;
          }

          setMensajeExitoTexto(`¡Permisos de ${usuarioEditar.nombreUsuario} actualizados!`);
        }
      } else {
        // CASO 3: Edición de la plantilla de Perfil Global
        await fetch(`http://localhost:8080/api/permisos/rol/${rolSeleccionado}/actualizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permisosActivosIds)
        });
        idRolFinalAsignado = rolSeleccionado;

        setMensajeExitoTexto('¡Permisos de perfil global actualizados!');
      }

      // ACTUALIZACIÓN EN VIVO DE SESIÓN Y EVENTOS LOCALES
      const usuarioSesionString = localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario');
      if (usuarioSesionString) {
        const usuarioSesion = JSON.parse(usuarioSesionString);
        
        const esMismoUsuario = usuarioEditar 
          ? (usuarioEditar.idUsuario === usuarioSesion.idUsuario)
          : (usuarioSesion.rol?.idRol === rolSeleccionado);

        if (esMismoUsuario) {
          usuarioSesion.permisos = permisosActivos;
          
          if (idRolFinalAsignado) {
            const rolInfo = roles.find(r => r.idRol === idRolFinalAsignado);
            usuarioSesion.rol = {
              idRol: idRolFinalAsignado,
              nombreRol: rolInfo ? rolInfo.nombreRol : (usuarioEditar?.rol?.nombreRol || usuarioSesion.rol?.nombreRol)
            };
          }

          localStorage.setItem('usuario_logueado', JSON.stringify(usuarioSesion));
          localStorage.setItem('usuario', JSON.stringify(usuarioSesion));

          window.dispatchEvent(new CustomEvent('permisos-actualizados', { detail: permisosActivos }));
          window.dispatchEvent(new Event('permisos-actualizados'));
          window.dispatchEvent(new Event('storage'));
        }
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
      setMensajeBloqueoTexto("El nombre del perfil no puede estar vacío");
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

  const rolUsuarioEsPersonalizado = usuarioEditar?.rol?.nombreRol.startsWith('PERFIL_') || usuarioEditar?.tienePermisosPersonalizados;

  const valorSelectRol = usuarioEditar 
    ? (rolSeleccionadoEnUsuario !== null ? rolSeleccionadoEnUsuario : (usuarioEditar.rol?.idRol || ''))
    : rolSeleccionado;

  return (
    <div className={`container-fluid font-monospace py-2 px-3 ${isDark ? 'text-white' : 'text-dark'}`}>
      {!isDark && (
        <style>{`
          select.form-select, 
          input.form-control {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          select.form-select:focus,
          input.form-control:focus {
            border-color: #8e45e0 !important;
            box-shadow: 0 0 0 0.25rem rgba(142, 69, 224, 0.2) !important;
          }
        `}</style>
      )}

      {/* HEADER Y SECTOR "ASIGNAR PERFIL A USUARIO" */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 className="fw-bold mb-0" style={{ fontSize: '1.6rem', color: isDark ? '#ffffff' : '#1e293b' }}>
            Matriz de Permisos por Perfil
          </h3>
          <p className="mb-0 small text-secondary" style={{ fontSize: '0.75rem' }}>
            Configuración dinámica de acceso a ventanas y asignación de personal
          </p>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <button 
            onClick={() => setMostrarModalNuevoRol(true)}
            className="btn btn-sm fw-bold d-flex align-items-center gap-1"
            style={{ backgroundColor: '#2b7a3e', border: '1px solid #20c997', fontSize: '0.8rem', color: '#ffffff' }}
          >
            <i className="bi bi-plus-lg"></i> Nuevo Perfil
          </button>

          {!usuarioEditar && rolSeleccionado > 2 && (
            <button 
              onClick={handleEliminarRol}
              className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
              style={{ backgroundColor: '#a52a2a', border: '1px solid #dc3545', fontSize: '0.8rem', color: '#ffffff !important' }}
              title="Eliminar perfil seleccionado"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}

          {/* PANEL DE SELECCIÓN Y DESTACADO */}
          <div 
            className="d-flex align-items-center gap-2 px-3 py-1 rounded-3 shadow-sm" 
            style={{ 
              backgroundColor: isDark ? (usuarioEditar ? '#1c102b' : '#18181b') : (usuarioEditar ? '#f3e8ff' : '#f8fafc'), 
              border: usuarioEditar ? '2px solid #20c997' : '2px solid #8e45e0',
              boxShadow: usuarioEditar ? '0 0 12px rgba(32, 201, 151, 0.3)' : '0 0 10px rgba(142, 69, 224, 0.2)'
            }}
          >
            <div className="d-flex flex-column align-items-start">
              <span className="fw-bold" style={{ fontSize: '0.7rem', color: usuarioEditar ? '#20c997' : '#8e45e0', letterSpacing: '0.5px' }}>
                <i className={`bi ${usuarioEditar ? 'bi-person-badge-fill text-success' : 'bi-shield-lock-fill text-warning'} me-1`}></i>
                {usuarioEditar ? 'ASIGNAR PERFIL A USUARIO:' : 'VER PLANTILLA DE PERFIL:'}
              </span>
              <span className="text-secondary" style={{ fontSize: '0.62rem' }}>
                {usuarioEditar ? 'Aplica la plantilla del rol seleccionado' : 'Edita permisos base del grupo'}
              </span>
            </div>

            <select 
              className={`form-select form-select-sm fw-bold shadow-sm py-1 px-2 ms-1 ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
              style={{ 
                width: '210px', 
                fontSize: '0.82rem',
                cursor: 'pointer',
                border: usuarioEditar ? '1px solid #20c997' : '1px solid #8e45e0'
              }}
              value={valorSelectRol}
              onChange={handleCambioPerfilSelect}
            >
              {usuarioEditar && rolUsuarioEsPersonalizado && rolSeleccionadoEnUsuario === null && (
                <option value={usuarioEditar.rol?.idRol} disabled style={{ backgroundColor: isDark ? '#2d2d30' : '#fff3cd', color: '#d97706' }}>
                  ★ PERFIL PERSONALIZADO
                </option>
              )}
              {roles.map(rol => (
                <option 
                  key={rol.idRol} 
                  value={rol.idRol}
                  style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a' }}
                >
                  {rol.nombreRol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* PANEL IZQUIERDO: LISTA DE USUARIOS */}
        <div className="col-md-3">
          <div 
            className="p-3 rounded-4" 
            style={{ 
              backgroundColor: isDark ? '#18181b' : '#ffffff', 
              border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1' 
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className={`fw-bold mb-0 small ${isDark ? 'text-white' : 'text-dark'}`}>
                <i className="bi bi-people-fill text-warning me-2"></i>Usuarios
              </h6>
              <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{usuarios.length}</span>
            </div>

            <div className="mb-2">
              <input 
                type="text" 
                className={`form-control form-control-sm border-secondary border-opacity-25 ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                style={{ fontSize: '0.75rem' }}
                placeholder="Buscar usuario..."
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
                    className="p-2 rounded d-flex justify-content-between align-items-center"
                    style={{ 
                      backgroundColor: esSeleccionado 
                        ? (isDark ? '#2b213a' : '#f3e8ff') 
                        : (isDark ? '#222122' : '#f8fafc'),
                      border: esSeleccionado ? '1px solid #8e45e0' : (isDark ? '1px solid #2d2d30' : '1px solid #e2e8f0')
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                        style={{ width: '28px', height: '28px', backgroundColor: '#8e45e0', fontSize: '0.7rem' }}
                      >
                        {iniciales}
                      </div>
                      <div style={{ lineHeight: '1.1' }}>
                        <p className={`mb-0 fw-bold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.75rem' }}>
                          {u.persona ? `${u.persona.nombre} ${u.persona.apellido}` : u.nombreUsuario}
                        </p>
                        <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                          @{u.nombreUsuario}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-dark border border-secondary text-info" style={{ fontSize: '0.6rem', padding: '3px 5px' }}>
                        {nombreRolMostrar}
                      </span>
                      <button 
                        onClick={() => seleccionarUsuarioParaPermisos(u)}
                        className="btn btn-sm p-0 px-1"
                        style={{ 
                          backgroundColor: esSeleccionado ? '#8e45e0' : 'transparent', 
                          color: esSeleccionado ? '#ffffff !important' : '#8e45e0',
                          border: '1px solid #8e45e0', 
                          fontSize: '0.7rem' 
                        }}
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

        {/* PANEL DERECHO: MATRIZ DE PERMISOS */}
        <div className="col-md-9">
          <div 
            className="p-3 rounded-4" 
            style={{ 
              backgroundColor: isDark ? '#18181b' : '#ffffff', 
              border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1' 
            }}
          >
            {usuarioEditar ? (
              <div 
                className="p-2 px-3 mb-3 rounded d-flex justify-content-between align-items-center" 
                style={{ 
                  backgroundColor: isDark ? '#132e27' : '#d1fae5', 
                  border: '1px solid #20c997' 
                }}
              >
                <div>
                  <span className="badge bg-success mb-0 me-2" style={{ fontSize: '0.7rem' }}>EMPLEADO SELECCIONADO</span>
                  <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>
                    Permisos de: <span style={{ color: '#059669' }}>"{usuarioEditar.persona ? `${usuarioEditar.persona.nombre} ${usuarioEditar.persona.apellido}` : usuarioEditar.nombreUsuario}"</span>
                  </span>
                  {usuarioEditar.idUsuario === 1 && <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>ADMIN PRINCIPAL</span>}
                </div>
                <button onClick={volverAModoGlobal} className="btn btn-sm btn-outline-secondary py-1 px-2" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-x-circle me-1"></i> Volver a Perfiles Globales
                </button>
              </div>
            ) : (
              <div 
                className="p-2 px-3 mb-3 rounded d-flex align-items-center" 
                style={{ 
                  backgroundColor: isDark ? '#222122' : '#f3e8ff', 
                  border: '1px solid #8e45e0' 
                }}
              >
                <span className="badge me-2" style={{ backgroundColor: '#8e45e0', fontSize: '0.7rem' }}>PERFIL GLOBAL</span>
                <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>
                  Permisos del perfil: <span style={{ color: '#8e45e0' }}>{roles.find(r => r.idRol === rolSeleccionado)?.nombreRol}</span>
                </span>
              </div>
            )}

            {/* CONTENEDOR MULTI-COLUMNA */}
            <div style={{ columnCount: 2, columnGap: '0.75rem' }}>
              {Object.entries(CATEGORIAS_SIDEBAR).map(([catNombre, ventanasList]) => {
                const modulosDeCategoria = modulos.filter(m => ventanasList.includes(m.nombrePermiso));
                if (modulosDeCategoria.length === 0) return null;

                return (
                  <div 
                    key={catNombre} 
                    className="p-2 px-3 rounded mb-3" 
                    style={{ 
                      backgroundColor: isDark ? '#141416' : '#f8fafc', 
                      border: isDark ? '1px solid #2d2d30' : '1px solid #e2e8f0',
                      breakInside: 'avoid'
                    }}
                  >
                    <h6 className="fw-bold text-secondary mb-2 border-bottom border-secondary border-opacity-25 pb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      — {catNombre}
                    </h6>
                    <div className="d-flex flex-column gap-2">
                      {modulosDeCategoria.map(mod => {
                        const bloqueado = esPermisoProtegido(mod.nombrePermiso);

                        return (
                          <div 
                            key={mod.idPermiso}
                            onClick={() => togglePermiso(mod.idPermiso, mod.nombrePermiso)}
                            className="d-flex justify-content-between align-items-center px-3 py-2 rounded transition-all"
                            style={{ 
                              backgroundColor: mod.activo 
                                ? (isDark ? 'rgba(142, 69, 224, 0.15)' : '#f3e8ff') 
                                : (isDark ? '#222122' : '#ffffff'), 
                              border: mod.activo ? '1px solid #8e45e0' : (isDark ? '1px solid #2d2d30' : '1px solid #cbd5e1'),
                              cursor: bloqueado ? 'not-allowed' : 'pointer',
                              opacity: bloqueado ? 0.75 : 1
                            }}
                          >
                            <div className="d-flex align-items-center gap-1">
                              <span className={`fw-semibold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.85rem' }}>
                                {mod.nombrePermiso}
                              </span>
                              {bloqueado && (
                                <i className="bi bi-lock-fill text-warning ms-1" style={{ fontSize: '0.8rem' }} title="Protegido para Perfil Administrador"></i>
                              )}
                            </div>
                            <span 
  className="px-2 py-1 rounded fw-bold" 
  style={{ 
    backgroundColor: mod.activo 
      ? (isDark ? 'rgba(25, 135, 84, 0.2)' : '#d1fae5') 
      : (isDark ? 'rgba(220, 53, 69, 0.2)' : '#fee2e2'),
    color: mod.activo 
      ? (isDark ? '#20c997' : '#065f46') 
      : (isDark ? '#ff6b6b' : '#991b1b'),
    border: mod.activo 
      ? (isDark ? '1px solid #198754' : '1px solid #a7f3d0') 
      : (isDark ? '1px solid #dc3545' : '1px solid #fca5a5'),
    fontSize: '0.7rem',
    letterSpacing: '0.5px'
  }}
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
              <button onClick={() => navigate('/dashboard')} className="btn btn-sm px-3 py-1 fw-bold" style={{ backgroundColor: '#c93030', borderRadius: '6px', fontSize: '0.85rem', color: '#ffffff' }}>
                Volver
              </button>
              <button onClick={handleGuardar} className="btn btn-sm px-4 py-1 fw-bold shadow" style={{ backgroundColor: '#2b7a3e', borderRadius: '6px', fontSize: '0.85rem', color: '#ffffff' }}>
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODALES */}
      {mostrarModalNuevoRol && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '12px' }}>
              <h5 className="fw-bold mb-3 text-center" style={{ color: '#8e45e0', fontSize: '1rem' }}>Crear Nuevo Perfil Global</h5>
              <div className="mb-3">
                <label className="text-secondary mb-1 small" style={{ fontSize: '0.75rem' }}>Nombre del Perfil (Ej: CAJERO)</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm bg-dark text-white border-secondary" 
                  value={nuevoRolNombre}
                  onChange={(e) => setNuevoRolNombre(e.target.value)}
                  placeholder="Escriba aquí..."
                />
              </div>
              <div className="d-flex justify-content-between gap-2">
                <button className="btn btn-sm w-50 fw-bold text-white" style={{ backgroundColor: '#a52a2a', color: '#ffffff !important' }} onClick={() => setMostrarModalNuevoRol(false)}>Cancelar</button>
                <button className="btn btn-sm w-50 fw-bold text-white" style={{ backgroundColor: '#2b7a3e', color: '#ffffff !important' }} onClick={handleCrearRol}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalConfirmacion && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #8e45e0', borderRadius: '12px' }}>
              <div className="modal-body text-center py-2">
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="mt-2 fw-bold">¡Atención!</h5>
                <p className="text-secondary mt-1 small" style={{ fontSize: '0.75rem' }}>
                  {usuarioEditar 
                    ? `Estás modificando la configuración de permisos para ${usuarioEditar.nombreUsuario}.`
                    : `Estás modificando la plantilla del Perfil Global.`}
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <button className="btn btn-sm px-3 fw-bold text-white w-50" style={{ backgroundColor: '#a52a2a', color: '#ffffff !important' }} onClick={() => setMostrarModalConfirmacion(false)}>Cancelar</button>
                  <button className="btn btn-sm px-3 fw-bold text-white w-50" style={{ backgroundColor: '#2b7a3e', color: '#ffffff !important' }} onClick={confirmarGuardado}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalExito && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #20c997', borderRadius: '12px' }}>
              <div className="modal-body text-center py-3">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#132e27', border: '2px solid #20c997' }}>
                    <i className="bi bi-check-lg text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h6 className="fw-bold my-2 text-white">{mensajeExitoTexto}</h6>
                <button className="btn btn-sm px-4 fw-bold text-white mt-2" style={{ backgroundColor: '#a52a2a', borderRadius: '6px', color: '#ffffff !important' }} onClick={() => setMostrarModalExito(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content text-white p-3" style={{ backgroundColor: '#18181b', border: '1px solid #ffc107', borderRadius: '12px' }}>
              <div className="modal-body text-center py-2">
                <div className="d-flex justify-content-center mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '2px solid #ffc107' }}>
                    <i className="bi bi-lock-fill text-warning" style={{ fontSize: '1.8rem' }}></i>
                  </div>
                </div>
                <p className="fw-bold mb-2 text-white px-1 small" style={{ fontSize: '0.8rem' }}>{mensajeBloqueoTexto}</p>
                <button className="btn btn-sm px-4 fw-bold text-white mt-1" style={{ backgroundColor: '#a52a2a', borderRadius: '6px', color: '#ffffff !important' }} onClick={() => setMostrarModalBloqueo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};