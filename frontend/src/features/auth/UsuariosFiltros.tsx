import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

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

  // Variables adaptativas según el tema
  const containerBg = isDark ? '#1d1d1d' : '#f1f5f9';
  const containerBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const inputBg = isDark ? '#121214' : '#ffffff';
  const inputTextColor = isDark ? 'text-white' : 'text-dark';
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
          className={`form-control ${inputTextColor} py-2`}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
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
          className={`form-select ${inputTextColor} py-2`} 
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
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
  );
};