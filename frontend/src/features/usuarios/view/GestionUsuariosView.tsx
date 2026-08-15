import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../../../components/layouts/SidebarLayout';
import { UsuarioEditModal } from '../components/UsuarioEditModal';
import { useUsuarios } from '../hooks/useUsuarios';
import { UbicacionViewModal } from '../../../components/modals/UbicacionViewModal';
import { SuccesModal } from '../../../components/layouts/SuccesModal';
import { UsuariosFiltros } from '../components/UsuariosFiltros';
import { RegisterView } from '../../primermenu/view/RegisterView';
import { useTheme } from '../../../Context/ThemeContext';

export const GestionUsuariosView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Estilos adaptativos de paleta siguiendo la estructura de ClientesView
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const tableContainerBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const tableContainerBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const tableHeaderBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableRowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const hoverRowBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const emptyTextColor = isDark ? 'text-white-50' : 'text-muted';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadText = isDark ? '#ffffff' : '#334155';

  const { usuarios, guardar, cargar } = useUsuarios();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [usuarioAEditar, setUsuarioAEditar] = useState<any | null>(null);
  const [usuarioConUbicacion, setUsuarioConUbicacion] = useState<any | null>(null);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [vistaActual, setVistaActual] = useState<'gestion' | 'registro'>('gestion');
  const navigate = useNavigate();

  const usuariosFiltrados = usuarios.filter(u => {
    const busqueda = filtroTexto.toLowerCase();
    
    const coincideTexto = u.nombreUsuario?.toLowerCase().includes(busqueda) ||
                          u.persona?.nombre?.toLowerCase().includes(busqueda) ||
                          u.persona?.apellido?.toLowerCase().includes(busqueda);
    
    const estadoUsuario = u.estado || 'Activo';
    const coincideEstado = filtroEstado === 'Sin Filtro' || estadoUsuario === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <SidebarLayout activeItem="Gestión de Usuarios">
      {vistaActual === 'gestion' ? (
        <div className="container-fluid px-0 h-100 d-flex flex-column">
          
          {/* Título de la Sección */}
          <div className="d-flex justify-content-center align-items-center mb-4 position-relative">
            <h1 
              className="fw-bold m-0 text-center font-monospace" 
              style={{ fontSize: '2.25rem', color: titleColor }}
            >
              Gestión de Usuarios
            </h1>
          </div>

          <UsuariosFiltros 
            filtroTexto={filtroTexto}
            setFiltroTexto={setFiltroTexto}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
          />

<div 
            className="table-responsive rounded-3 border mb-2 font-monospace" 
            style={{ 
              backgroundColor: tableContainerBg, 
              borderColor: tableContainerBorder,
              height: '65vh',
              overflowY: 'auto',
              display: 'block'
            }}
          >
            <table 
              className="table-hover m-0 align-middle w-100" 
              style={{ borderCollapse: 'collapse', color: tableText, backgroundColor: tableContainerBg }}
            >
              <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1, color: theadText }}>
                <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${tableHeaderBorder}`, color: theadText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th className="py-3 px-3 text-center">ID</th>
                  <th className="py-3 px-3 text-start">Usuario</th>
                  <th className="py-3 px-3 text-start">Contraseña</th>
                  <th className="py-3 px-3 text-start">Nombre</th>
                  <th className="py-3 px-3 text-start">Apellido</th>
                  <th className="py-3 px-3 text-start">Documento</th>
                  <th className="py-3 px-3 text-start">Cargo</th>
                  <th className="py-3 px-3 text-end">Salario</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Opciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {usuariosFiltrados && usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u, index) => (
                    <tr 
                      key={u.idUsuario} 
                      style={{ borderBottom: index === usuariosFiltrados.length - 1 ? 'none' : `1px solid ${tableRowBorder}` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverRowBg} 
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="py-3 px-3 text-center text-info fw-bold">#{u.idUsuario}</td>
                      <td className="py-3 px-3 fw-bold" style={{ color: tableText }}>{u.nombreUsuario}</td>
                      <td className="py-3 px-3" style={{ color: tableText }}>{u.password}</td>
                      <td className="py-3 px-3" style={{ color: tableText }}>{u.persona?.nombre || '-'}</td>
                      <td className="py-3 px-3" style={{ color: tableText }}>{u.persona?.apellido || '-'}</td>
                      <td className="py-3 px-3" style={{ color: tableText }}>{u.persona?.numeroDocumento || '-'}</td>
                      <td className="py-3 px-3" style={{ color: tableText }}>{u.cargo || '-'}</td>
                      <td className="py-3 px-3 text-end fw-semibold" style={{ color: tableText }}>
                        ${Number(u.salario || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span 
                          className={`badge rounded-pill px-3 py-2 font-monospace ${
                            u.estado === 'Activo' 
                              ? 'bg-success bg-opacity-75' 
                              : u.estado === 'Pendiente' 
                              ? 'bg-warning bg-opacity-75' 
                              : 'bg-danger bg-opacity-75'
                          }`}
                          style={{ 
                            fontSize: '0.8rem',
                            color: '#ffffff'
                          }}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => setUsuarioAEditar(u)}
                            title="Editar Usuario"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button 
                            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
                            style={{ width: '34px', height: '34px' }}
                            onClick={() => setUsuarioConUbicacion(u)}
                            title="Ver Ubicación"
                          >
                            <i className="bi bi-house-door"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className={`text-center py-5 border-0 ${emptyTextColor}`}>
                      <i className="bi bi-search display-5 d-block mb-2 opacity-50"></i>
                      <span>No se encontraron usuarios registrados o no coinciden con la búsqueda.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
</div>

          {/* Botonera Inferior Estilizada */}
          <div className="d-flex justify-content-between align-items-center gap-3 mt-4 font-monospace">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary px-4 py-2 fw-semibold"
              style={{ color: '#ffffff' }}
            >
              <i className="bi"></i>Volver
            </button>

            <button 
              onClick={() => setVistaActual('registro')} 
              className="btn btn-success px-4 py-2 fw-semibold shadow-sm"
              style={{ color: '#ffffff' }}
            >
              <i className="bi me-2"></i>Crear Nuevo Usuario
            </button>
          </div>
        </div>
      ) : (
        <div className="transparente-registro" style={{ minHeight: '80vh' }}>
          <RegisterView 
            onVolver={() => {
              setVistaActual('gestion'); 
              cargar();                  
            }}
          />
        </div>
      )}

      {usuarioAEditar && (
        <UsuarioEditModal 
          usuario={usuarioAEditar} 
          onCerrar={() => setUsuarioAEditar(null)} 
          onConfirmar={async (u) => { 
            try {
              const usuarioFormateado = {
                ...u,
                salario: u.salario ? Number(u.salario) : 0, 
                estado: u.estado || 'Activo'                
              };
              
              await guardar(usuarioFormateado); 
              setUsuarioAEditar(null); 
              cargar();
              setMensajeExito(u.idUsuario ? 'Usuario modificado correctamente' : 'Usuario creado correctamente');
              setMostrarExito(true); 
            } catch (error) {
              alert("Error al guardar el usuario. Verificá los datos o los roles en el backend.");
              console.error(error);
            }
          }} 
        />
      )}

      {usuarioConUbicacion && (
        <UbicacionViewModal 
          cliente={usuarioConUbicacion} 
          onCerrar={() => setUsuarioConUbicacion(null)}
          onConfirmar={async (usuarioActualizado) => {
            try {
              await guardar(usuarioActualizado);
              setUsuarioConUbicacion(null);
              cargar(); 
              setMensajeExito('Usuario modificado correctamente');
              setMostrarExito(true);
            } catch (error) {
              alert("Error al actualizar la ubicación en el servidor.");
              console.error(error);
            }
          }}
        />
      )}
      
      {mostrarExito && (
        <SuccesModal 
          show={mostrarExito} 
          onClose={() => setMostrarExito(false)} 
          message={mensajeExito} 
        />
      )}

    </SidebarLayout>
  );
};