import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  return (
    <div className="row g-3 align-items-center mb-4 p-3 rounded" style={{ backgroundColor: isDark ? '#1d1d1d' : '#f1f5f9', border: `1px solid ${isDark ? '#2d2d30' : '#cbd5e1'}` }}>
      <div className="col-md-6">
        <label className="form-label small font-monospace" style={{ color: mutedText }}>Filtrar por Nombre:</label>
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
        <label className="form-label small font-monospace" style={{ color: mutedText }}>Filtrar por Estado:</label>
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