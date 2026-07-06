import React from 'react';

interface InsumosFiltrosProps {
  filtroNombre: string;
  setFiltroNombre: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
}

export const InsumosFiltros: React.FC<InsumosFiltrosProps> = ({
  filtroNombre,
  setFiltroNombre,
  filtroEstado,
  setFiltroEstado,
}) => {
  return (
    <div className="row g-3 align-items-center mb-4 p-3 rounded" style={{ backgroundColor: '#1d1d1d', border: '1px solid #2d2d30' }}>
      <div className="col-md-6">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Nombre:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary py-2"
          style={{ borderColor: '#3f3f46' }}
          placeholder="Buscar insumo..." 
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>
      
      <div className="col-md-6">
        <label className="form-label text-white-50 small font-monospace">Filtrar por Estado:</label>
        <select 
          className="form-select bg-dark text-white border-secondary py-2"
          style={{ borderColor: '#3f3f46' }}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Sin Filtro">Sin Filtro</option>
          <option value="Activo">Activo</option>
          <option value="Desactivado">Desactivado</option>
        </select>
      </div>
    </div>
  );
};