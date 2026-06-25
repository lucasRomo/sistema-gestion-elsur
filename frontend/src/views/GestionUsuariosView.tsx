import React, { useState } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { UsuarioEditModal } from '../features/modals/UsuarioEditModal';
import { UbicacionViewModal } from '../features/modals/UbicacionViewModal';
import { useUsuarios } from '../hooks/useUsuarios';

export const GestionUsuariosView: React.FC = () => {
  const { usuarios, guardar, cargar } = useUsuarios();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  const [usuarioAEditar, setUsuarioAEditar] = useState<any | null>(null);
  const [usuarioConUbicacion, setUsuarioConUbicacion] = useState<any | null>(null);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return '#4ade80';
      case 'Desactivado': return '#f87171';
      case 'Pendiente': return '#facc15';
      default: return '#fff';
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const busqueda = filtroTexto.toLowerCase();
    const coincideTexto = u.nombreUsuario?.toLowerCase().includes(busqueda) ||
                          u.persona?.nombre?.toLowerCase().includes(busqueda) ||
                          u.persona?.apellido?.toLowerCase().includes(busqueda);
    const coincideEstado = filtroEstado === 'Sin Filtro' || u.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <SidebarLayout activeItem="Gestión de Usuarios">
      <div className="container-fluid text-white h-100 d-flex flex-column">
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Gestión de Usuarios
            </h1>
          </div>
        </div>

        <div className="d-flex gap-4 mb-4 align-items-end">
          <div className="flex-grow-1" style={{ maxWidth: '600px' }}>
            <label className="form-label small text-secondary fw-bold">Filtrar por Nombre:</label>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control bg-white text-dark border-0" 
                placeholder="Filtrar por Usuario, Nombre o Apellido..." 
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
              <span className="input-group-text bg-white border-0"><i className="bi bi-search text-secondary"></i></span>
            </div>
          </div>
          <div style={{ width: '200px' }}>
            <label className="form-label small text-secondary fw-bold">Filtrar por Estado:</label>
            <select 
              className="form-select bg-white text-dark border-0"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="Sin Filtro">Sin Filtro</option>
              <option value="Activo">Activo</option>
              <option value="Desactivado">Desactivado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto rounded" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46' }}>
          <table className="table table-dark table-hover m-0">
            <thead style={{ borderBottom: '2px solid #3f3f46' }}>
              <tr>
                <th className="py-3 px-3 text-secondary fw-normal">Id</th>
                <th className="py-3 text-secondary fw-normal">Usuario</th>
                <th className="py-3 text-secondary fw-normal">Contraseña</th>
                <th className="py-3 text-secondary fw-normal">Nombre</th>
                <th className="py-3 text-secondary fw-normal">Apellido</th>
                <th className="py-3 text-secondary fw-normal">Salario</th>
                <th className="py-3 text-secondary fw-normal text-center">Estado</th>
                <th className="py-3 text-secondary fw-normal text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.idUsuario} style={{ borderBottom: '1px solid #2d2d30' }}>
                  <td className="py-3 px-3">{u.idUsuario}</td>
                  <td className="py-3">{u.nombreUsuario}</td>
                  <td className="py-3">{u.password}</td>
                  <td className="py-3">{u.persona?.nombre || '-'}</td>
                  <td className="py-3">{u.persona?.apellido || '-'}</td>
                  <td className="py-3 text-end font-monospace">{u.salario?.toLocaleString('es-AR') || '0'}</td>
                  <td className="py-3 text-center" style={{ color: getEstadoColor(u.estado) }}>{u.estado}</td>
                  <td className="py-3 text-center">
                    <button className="btn btn-link p-0 me-2 text-info" onClick={() => setUsuarioAEditar(u)}>
                      <i className="bi bi-pencil-square fs-5"></i>
                    </button>
                    <button className="btn btn-link p-0 text-warning" onClick={() => setUsuarioConUbicacion(u)}>
                      <i className="bi bi-house-door fs-5"></i>
                    </button>
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
      </div>

      {usuarioAEditar && (
        <UsuarioEditModal 
          usuario={usuarioAEditar} 
          onCerrar={() => setUsuarioAEditar(null)} 
          onConfirmar={async (u) => { await guardar(u); setUsuarioAEditar(null); cargar(); }} 
        />
      )}

      {usuarioConUbicacion && (
        <UbicacionViewModal 
          cliente={usuarioConUbicacion} 
          onCerrar={() => setUsuarioConUbicacion(null)} 
          onConfirmar={async (u) => { await guardar(u); setUsuarioConUbicacion(null); }} 
        />
      )}
    </SidebarLayout>
  );
};