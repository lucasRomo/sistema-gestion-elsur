import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { UsuarioEditModal } from '../components/modals/UsuarioEditModal';
import { UbicacionViewModal } from '../components/modals/UbicacionViewModal';
// import { Usuario } from '../types/Usuario'; // Asegurate de importar tu tipo

export const GestionUsuariosView: React.FC = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Sin Filtro');
  
  // Estados para los modales
  const [usuarioAEditar, setUsuarioAEditar] = useState<any | null>(null);
  const [usuarioConUbicacion, setUsuarioConUbicacion] = useState<any | null>(null);

  // Carga inicial (Mockeada basada en tu imagen para que la veas andando)
  useEffect(() => {
    // Acá iría tu fetch real: fetch('http://localhost:8080/api/usuarios')
    setUsuarios([
      { idUsuario: 2, nombreUsuario: 'Pedro', password: 'Pedro123', salario: 1000000, estado: 'Activo', rol: { idRol: 3, nombre: 'Gerente' }, persona: { idPersona: 4, nombre: 'Pedro', apellido: 'Lopez', direccion: { calle: 'San Martin', numero: '123' } } },
      { idUsuario: 3, nombreUsuario: 'Lisandro', password: 'Lisandro123', salario: 1000000, estado: 'Activo', rol: { idRol: 4, nombre: 'Operario' }, persona: { idPersona: 5, nombre: 'Lisandro', apellido: 'Romero H' } },
      { idUsuario: 4, nombreUsuario: 'Lucas', password: 'Lucas123', salario: 1000000, estado: 'Desactivado', rol: { idRol: 4, nombre: 'Operario' }, persona: { idPersona: 6, nombre: 'Lucas', apellido: 'Romo' } },
      { idUsuario: 5, nombreUsuario: 'Nicolas', password: 'Nicolas123', salario: 1000000, estado: 'Pendiente', rol: { idRol: 1, nombre: 'Admin' }, persona: { idPersona: 20, nombre: 'Nicolas', apellido: 'Ricatti' } },
    ]);
  }, []);

  // Lógica de filtrado
  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = 
      u.nombreUsuario.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      u.persona.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      u.persona.apellido.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideEstado = filtroEstado === 'Sin Filtro' || u.estado === filtroEstado;
    
    return coincideTexto && coincideEstado;
  });

  // Handlers para la API (Acá conectás con tu backend en Java)
  const handleGuardarEdicion = async (usuarioActualizado: any) => {
    console.log("Guardando en BD...", usuarioActualizado);
    // await fetch(`.../usuarios/${usuarioActualizado.idUsuario}`, { method: 'PUT', ... })
    setUsuarios(usuarios.map(u => u.idUsuario === usuarioActualizado.idUsuario ? usuarioActualizado : u));
    setUsuarioAEditar(null);
  };

  const handleGuardarUbicacion = async (clienteActualizado: any) => {
    // Reutilizamos tu lógica de guardar ubicación
    console.log("Actualizando dirección de persona...", clienteActualizado);
    setUsuarioConUbicacion(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return '#4ade80'; // Verde
      case 'Desactivado': return '#f87171'; // Rojo
      case 'Pendiente': return '#facc15'; // Amarillo
      default: return '#fff';
    }
  };

  return (
    <SidebarLayout activeItem="Gestión de Usuarios">
      <div className="container-fluid text-white h-100 d-flex flex-column">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="w-100 text-center position-relative">
            <h1 className="fw-bold tracking-wider font-monospace m-0" style={{ fontSize: '2.5rem', color: '#ffffff' }}>
              Gestión de Usuarios
            </h1>
            <div className="position-absolute end-0 top-50 translate-middle-y text-info fs-3" style={{ cursor: 'pointer' }}>
              <i className="bi bi-question-circle"></i>
            </div>
          </div>
        </div>

        {/* Filtros */}
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

        {/* Tabla */}
        <div className="flex-grow-1 overflow-auto rounded" style={{ backgroundColor: '#1a1a1c', border: '1px solid #3f3f46' }}>
          <table className="table table-dark table-hover m-0" style={{ backgroundColor: 'transparent' }}>
            <thead style={{ borderBottom: '2px solid #3f3f46' }}>
              <tr>
                <th className="py-3 px-3 text-secondary fw-normal">Id</th>
                <th className="py-3 text-secondary fw-normal">Usuario</th>
                <th className="py-3 text-secondary fw-normal">Contraseña</th>
                <th className="py-3 text-secondary fw-normal">Nombre</th>
                <th className="py-3 text-secondary fw-normal">Apellido</th>
                <th className="py-3 text-secondary fw-normal">Id Persona</th>
                <th className="py-3 text-secondary fw-normal">Id Rol</th>
                <th className="py-3 text-secondary fw-normal text-end">Salario</th>
                <th className="py-3 text-secondary fw-normal text-center">Estado</th>
                <th className="py-3 text-secondary fw-normal text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.idUsuario} style={{ borderBottom: '1px solid #2d2d30' }}>
                  <td className="py-3 px-3 align-middle">{u.idUsuario}</td>
                  <td className="py-3 align-middle">{u.nombreUsuario}</td>
                  <td className="py-3 align-middle">{u.password}</td>
                  <td className="py-3 align-middle">{u.persona.nombre}</td>
                  <td className="py-3 align-middle">{u.persona.apellido}</td>
                  <td className="py-3 align-middle text-center">{u.persona.idPersona < 10 ? `0${u.persona.idPersona}` : u.persona.idPersona}</td>
                  <td className="py-3 align-middle text-center">{u.rol.idRol}</td>
                  <td className="py-3 align-middle text-end font-monospace">{u.salario.toLocaleString('es-AR')}</td>
                  <td className="py-3 align-middle text-center" style={{ color: getEstadoColor(u.estado) }}>
                    {u.estado}
                  </td>
                  <td className="py-3 align-middle text-center">
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

        {/* Botonera Inferior */}
        <div className="d-flex justify-content-between mt-4">
          <button className="btn btn-danger px-5 py-2" style={{ backgroundColor: '#c53030', border: 'none', borderRadius: '8px' }}>Volver</button>
          <div className="d-flex gap-3">
            <button className="btn px-4 py-2 text-white" style={{ backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px' }}>Cambiar Permisos a Usuario</button>
            <button className="btn px-4 py-2 text-white" style={{ backgroundColor: '#22c55e', border: 'none', borderRadius: '8px' }}>Crear Nuevo Usuario</button>
          </div>
        </div>

      </div>

      {/* Renderizado Condicional de Modales */}
      {usuarioAEditar && (
        <UsuarioEditModal 
          usuario={usuarioAEditar} 
          onCerrar={() => setUsuarioAEditar(null)} 
          onConfirmar={handleGuardarEdicion} 
        />
      )}

      {/* Reutilizamos el modal de ubicación pasándole el objeto formateado como si fuera cliente */}
      {usuarioConUbicacion && (
        <UbicacionViewModal 
          cliente={usuarioConUbicacion} // El modal usa cliente.persona.direccion, que es igual en el usuario
          onCerrar={() => setUsuarioConUbicacion(null)} 
          onConfirmar={handleGuardarUbicacion} 
        />
      )}

    </SidebarLayout>
  );
};