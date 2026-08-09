import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

interface UsuariosFiltrosProps {
  filtroTexto: string;
  setFiltroTexto: (val: string) => void;
  filtroEstado: string;
  setFiltroEstado: (val: string) => void;
}

export const UsuariosFiltros: React.FC<UsuariosFiltrosProps> = ({
  filtroTexto,
  setFiltroTexto,
  filtroEstado,
  setFiltroEstado,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Contenedor adaptativo alineado al diseño de ClientesFiltros
  const containerBg = isDark ? '#1d1d1d' : '#ffffff';
  const containerBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  return (
    <div 
      className="row g-3 align-items-center mb-4 p-3 rounded shadow-sm" 
      style={{ 
        backgroundColor: containerBg, 
        border: `1px solid ${containerBorder}`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <div className="col-md-6">
        <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
          Filtrar por Usuario / Nombre / Apellido:
        </label>
        <input 
          type="text"
          className="form-control py-2 font-monospace"
          style={{ 
            backgroundColor: inputBg, 
            borderColor: inputBorder,
            color: inputTextColor 
          }}
          placeholder="Buscar..." 
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
          Filtrar por Estado:
        </label>
        <select 
          className="form-select py-2 font-monospace" 
          style={{ 
            backgroundColor: inputBg, 
            borderColor: inputBorder,
            color: inputTextColor
          }}
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="Sin Filtro" style={{ backgroundColor: inputBg, color: inputTextColor }}>Sin Filtro</option>
          <option value="Activo" style={{ backgroundColor: inputBg, color: inputTextColor }}>Activo</option>
          <option value="Desactivado" style={{ backgroundColor: inputBg, color: inputTextColor }}>Desactivado</option>
          <option value="Pendiente" style={{ backgroundColor: inputBg, color: inputTextColor }}>Pendiente</option>
        </select>
      </div>
    </div>
  );
};