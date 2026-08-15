import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../Context/ThemeContext';
import { useMatrizPermisos } from '../hook/useMatrizPermisos';
import { ListaUsuariosSidebar } from '../components/ListaUsuariosSidebar';
import { GrillaPermisos } from '../components/GrillaPermisos';
import { ModalesMatrizPermisos } from '../components/ModalesMatrizPermisos';

export const MatrizPermisosView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    roles,
    rolSeleccionado,
    modulos,
    usuariosFiltrados,
    usuarioEditar,
    busquedaUsuario,
    setBusquedaUsuario,
    valorSelectRol,
    rolUsuarioEsPersonalizado,
    rolSeleccionadoEnUsuario,
    mostrarModalConfirmacion,
    setMostrarModalConfirmacion,
    mostrarModalExito,
    setMostrarModalExito,
    mensajeExitoTexto,
    mostrarModalBloqueo,
    setMostrarModalBloqueo,
    mensajeBloqueoTexto,
    mostrarModalNuevoRol,
    setMostrarModalNuevoRol,
    nuevoRolNombre,
    setNuevoRolNombre,
    togglePermiso,
    esPermisoProtegido,
    handleCambioPerfilSelect,
    seleccionarUsuarioParaPermisos,
    volverAModoGlobal,
    confirmarGuardado,
    handleCrearRol,
    handleEliminarRol
  } = useMatrizPermisos();

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
              style={{ backgroundColor: '#a52a2a', border: '1px solid #dc3545', fontSize: '0.8rem' }}
              title="Eliminar perfil seleccionado"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}

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
        {/* PANEL IZQUIERDO */}
        <div className="col-md-3">
          <ListaUsuariosSidebar 
            usuarios={usuariosFiltrados}
            busquedaUsuario={busquedaUsuario}
            setBusquedaUsuario={setBusquedaUsuario}
            usuarioEditar={usuarioEditar}
            seleccionarUsuarioParaPermisos={seleccionarUsuarioParaPermisos}
            isDark={isDark}
          />
        </div>

        {/* PANEL DERECHO */}
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

            {/* GRILLA DE CATEGORÍAS Y PERMISOS */}
            <GrillaPermisos 
              modulos={modulos}
              togglePermiso={togglePermiso}
              esPermisoProtegido={esPermisoProtegido}
              isDark={isDark}
            />

            {/* BOTONES DE ACCIÓN */}
            <div className="d-flex justify-content-between mt-3 pt-2 border-top border-secondary border-opacity-25">
              <button onClick={() => navigate('/dashboard')} className="btn btn-secondary px-3 py-1 fw-bold" style={{ borderRadius: '6px', fontSize: '0.85rem', color: '#ffffff' }}>
                Volver
              </button>
              <button onClick={() => setMostrarModalConfirmacion(true)} className="btn btn-sm px-4 py-1 fw-bold shadow" style={{ backgroundColor: '#2b7a3e', borderRadius: '6px', fontSize: '0.85rem', color: '#ffffff' }}>
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* CONTENEDOR DE MODALES */}
      <ModalesMatrizPermisos 
        mostrarModalNuevoRol={mostrarModalNuevoRol}
        setMostrarModalNuevoRol={setMostrarModalNuevoRol}
        nuevoRolNombre={nuevoRolNombre}
        setNuevoRolNombre={setNuevoRolNombre}
        handleCrearRol={handleCrearRol}
        mostrarModalConfirmacion={mostrarModalConfirmacion}
        setMostrarModalConfirmacion={setMostrarModalConfirmacion}
        confirmarGuardado={confirmarGuardado}
        usuarioEditar={usuarioEditar}
        mostrarModalExito={mostrarModalExito}
        setMostrarModalExito={setMostrarModalExito}
        mensajeExitoTexto={mensajeExitoTexto}
        mostrarModalBloqueo={mostrarModalBloqueo}
        setMostrarModalBloqueo={setMostrarModalBloqueo}
        mensajeBloqueoTexto={mensajeBloqueoTexto}
      />
    </div>
  );
};