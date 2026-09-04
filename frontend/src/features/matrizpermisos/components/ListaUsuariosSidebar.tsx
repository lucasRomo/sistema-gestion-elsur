import React from 'react';
import type { Usuario } from '../service/matrizPermisosService';

interface Props {
  usuarios: Usuario[];
  busquedaUsuario: string;
  setBusquedaUsuario: (val: string) => void;
  usuarioEditar: Usuario | null;
  seleccionarUsuarioParaPermisos: (usuario: Usuario) => void;
  isDark: boolean;
}

export const ListaUsuariosSidebar: React.FC<Props> = ({
  usuarios,
  busquedaUsuario,
  setBusquedaUsuario,
  usuarioEditar,
  seleccionarUsuarioParaPermisos,
  isDark
}) => {
  return (
    <div 
      className="p-3 rounded-4" 
      style={{ 
        backgroundColor: isDark ? '#18181b' : '#ffffff', 
        border: isDark ? '1px solid #3f3f46' : '1px solid #cbd5e1' 
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className={`fw-bold mb-0 ${isDark ? 'text-white' : 'text-dark'}`}>
          <i className="bi bi-people-fill text-warning me-2"></i>Usuarios
        </h6>
        <span className="badge bg-secondary" style={{ fontSize: '0.9rem' }}>{usuarios.length}</span>
      </div>

      <div className="mb-2">
        <input 
          type="text" 
          className={`form-control form-control-sm border-secondary border-opacity-25 ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
          style={{ fontSize: '1rem' }}
          placeholder="Buscar usuario..."
          value={busquedaUsuario}
          onChange={(e) => setBusquedaUsuario(e.target.value)}
        />
      </div>

      <div className="d-flex flex-column gap-1" style={{ maxHeight: '560px', overflowY: 'auto' }}>
        {usuarios.map(u => {
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
                  style={{ width: '28px', height: '28px', backgroundColor: '#8e45e0', fontSize: '1 rem' }}
                >
                  {iniciales}
                </div>
                <div style={{ lineHeight: '1.1' }}>
                  <p className={`mb-0 fw-bold ${isDark ? 'text-white' : 'text-dark'}`} style={{ fontSize: '1 rem' }}>
                    {u.persona ? `${u.persona.nombre} ${u.persona.apellido}` : u.nombreUsuario}
                  </p>
                  <span className="text-secondary" style={{ fontSize: '1rem' }}>
                    @{u.nombreUsuario}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-dark border border-secondary text-info" style={{ fontSize: '0.8rem', padding: '3px 5px' }}>
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
  );
};