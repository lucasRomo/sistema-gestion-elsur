import React, { useState } from 'react';
import { UsuarioEditModal } from '../features/modals/UsuarioEditModal';
import { useUsuarios } from '../hooks/useUsuarios';
import { UbicacionViewModal } from '../features/modals/UbicacionViewModal';
import { SuccesModal } from '../components/layouts/SuccesModal';
import { UsuariosFiltros } from '../features/auth/UsuariosFiltros';

export const GestionUsuariosView: React.FC = () => {
  const { usuarios, guardar, cargar } = useUsuarios();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [usuarioAEditar, setUsuarioAEditar] = useState<any | null>(null);
  const [usuarioConUbicacion, setUsuarioConUbicacion] = useState<any | null>(null);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

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
    // CORRECCIÓN 1: Quitamos <SidebarLayout> de acá para evitar duplicados. Solo devolvemos el container.
    <div className="container-fluid text-white h-100 d-flex flex-column">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="w-100 text-center position-relative">
          <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
            Gestión de Usuarios
          </h1>
        </div>
      </div>

      <UsuariosFiltros 
      filtroTexto={filtroTexto}
      setFiltroTexto={setFiltroTexto}
      filtroEstado={filtroEstado}
      setFiltroEstado={setFiltroEstado}
      />

      <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
       <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
       <thead>
    <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
      <th style={{ padding: '12px' }}>Id</th>
      <th style={{ padding: '12px' }}>Usuario</th>
      <th style={{ padding: '12px' }}>Contraseña</th>
      <th style={{ padding: '12px' }}>Nombre</th>
      <th style={{ padding: '12px' }}>Apellido</th>
      <th style={{ padding: '12px' }}>Documento</th>
      <th style={{ padding: '12px', textAlign: 'left' }}>Cargo</th>
      <th style={{ padding: '12px', textAlign: 'right' }}>Salario</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
    </tr>
  </thead>
  <tbody>
    {usuariosFiltrados.map((u) => (
      <tr 
        key={u.idUsuario} 
        style={{ borderBottom: '1px solid #2d2d30' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <td style={{ padding: '12px' }}>{u.idUsuario}</td>
        <td style={{ padding: '12px' }}>{u.nombreUsuario}</td>
        <td style={{ padding: '12px' }}>{u.password}</td>
        <td style={{ padding: '12px' }}>{u.persona?.nombre || '-'}</td>
        <td style={{ padding: '12px' }}>{u.persona?.apellido || '-'}</td>
        <td style={{ padding: '12px' }}>{u.persona?.numeroDocumento || '-'}</td>
        <td style={{ padding: '12px' }}>{u.cargo || '-'}</td>
        <td style={{ padding: '12px', textAlign: 'right' }}>${Number(u.salario || 0).toLocaleString('es-AR')}</td>
        <td style={{ padding: '12px', textAlign: 'center' }}>
          <span className={`badge ${u.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
            {u.estado}
          </span>
        </td>
        <td style={{ padding: '12px' }}>
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px' }}
              onClick={() => setUsuarioAEditar(u)}
              title="Editar Usuario"
            >
              <i className="bi bi-pencil-square"></i>
            </button>
            <button 
              className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px', color: '#ffc107', borderColor: '#ffc107' }}
              onClick={() => setUsuarioConUbicacion(u)}
              title="Ver Ubicación"
            >
              <i className="bi bi-house-door"></i>
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>

      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-danger px-5 py-2">Volver</button>
        <div className="d-flex gap-3">
          <button className="btn btn-success px-4 py-2">Crear Nuevo Usuario</button>
        </div>
      </div>

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

  </div>
  );
};