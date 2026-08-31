import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

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

  const containerBg = isDark ? '#1b1b1b' : '#ffffff';
  const containerBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const inputBg = isDark ? '#1b1b1b' : '#ffffff';
  const inputTextColor = isDark ? 'text-white' : 'text-dark';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  return (
    <div 
      className="row g-3 align-items-center mb-4 p-3 rounded-3 shadow-sm font-monospace" 
      style={{ 
        backgroundColor: containerBg, 
        border: `1px solid ${containerBorder}`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <div className="col-md-6">
        <label className="form-label small fw-semibold" style={{ color: mutedText }}>
          Filtrar por Nombre:
        </label>
        <input 
          type="text" 
          className={`form-control ${inputTextColor} py-2 shadow-none`}
          style={{ 
            backgroundColor: inputBg, 
            borderColor: inputBorder 
          }}
          placeholder="Escribí el nombre del insumo..." 
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>
      
      <div className="col-md-6">
        <label className="form-label small fw-semibold" style={{ color: mutedText }}>
          Filtrar por Estado:
        </label>
        <select 
          className={`form-select ${inputTextColor} py-2 shadow-none`}
          style={{ 
            backgroundColor: inputBg, 
            borderColor: inputBorder 
          }}
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