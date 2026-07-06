import React from 'react';

interface ProveedorFiltrosProps {
  filtroNombre: string;
  setFiltroNombre: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
  filtroTipo: string;
  setFiltroTipo: (val: string) => void;
  tiposUnicos: string[];
}

export const ProveedorFiltros: React.FC<ProveedorFiltrosProps> = ({
  filtroNombre,
  setFiltroNombre,
  filtroEstado,
  setFiltroEstado,
  filtroTipo,
  setFiltroTipo,
  tiposUnicos
}) => {
  return (
    <div className="row g-3 align-items-center mb-4 p-3 rounded" style={{ backgroundColor: '#1d1d1d', border: '1px solid #2d2d30' }}>
      <div className="col-md-4">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Nombre / Contacto:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary py-2"
          style={{ borderColor: '#3f3f46' }}
          placeholder="Buscar proveedor..." 
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>
      
      <div className="col-md-4">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Estado:</label>
        <select 
          className="form-select bg-dark text-white border-secondary py-2"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Sin Filtro">Sin Filtro</option>
          <option value="Activo">Activo</option>
          <option value="Desact..">Desactivado</option>
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Tipo:</label>
        <select 
          className="form-select bg-dark text-white border-secondary py-2"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="Sin Filtro">Sin Filtro</option>
          {tiposUnicos.map((tipo) => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
    </div>
  );
};