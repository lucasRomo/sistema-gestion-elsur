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

  const cardBg = isDark ? '#1d1d1d' : '#ffffff';
  const cardBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const inputBg = isDark ? '#27272a' : '#ffffff';

  return (
    <div 
      className="row g-3 align-items-center mb-4 p-3 rounded-3 shadow-sm font-monospace" 
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="col-md-6">
        <label className="form-label small fw-bold mb-1" style={{ color: mutedText }}>
          Filtrar por Nombre:
        </label>
        <input 
          type="text" 
          className="form-control py-2 shadow-none"
          style={{ 
            backgroundColor: inputBg, 
            color: textColor, 
            borderColor: cardBorder,
            borderRadius: '6px'
          }}
          placeholder="Escribí el nombre del insumo..." 
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>
      
      <div className="col-md-6">
        <label className="form-label small fw-bold mb-1" style={{ color: mutedText }}>
          Filtrar por Estado:
        </label>
        <select 
          className="form-select py-2 shadow-none"
          style={{ 
            backgroundColor: inputBg, 
            color: textColor, 
            borderColor: cardBorder,
            borderRadius: '6px'
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