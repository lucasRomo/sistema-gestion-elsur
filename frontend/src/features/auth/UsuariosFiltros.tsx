import React from 'react';

interface UsuariosFiltrosProps {
  filtroTexto: string;
  setFiltroTexto: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
}

export const UsuariosFiltros: React.FC<UsuariosFiltrosProps> = ({
  filtroTexto, setFiltroTexto, filtroEstado, setFiltroEstado
}) => {
  return (
    <div className="row g-3 align-items-center mb-4 p-3 rounded" style={{ backgroundColor: '#1d1d1d', border: '1px solid #3f3f46' }}>
      <div className="col-md-6">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Usuario / Nombre / Apellido:</label>
        <input 
          className="form-control bg-dark text-white border-secondary py-2"
          placeholder="Buscar..." 
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Estado:</label>
        <select className="form-select bg-dark text-white border-secondary py-2" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="Sin Filtro">Sin Filtro</option>
          <option value="Activo">Activo</option>
          <option value="Desactivado">Desactivado</option>
          <option value="Pendiente">Pendiente</option>
        </select>
      </div>
    </div>
  );
};