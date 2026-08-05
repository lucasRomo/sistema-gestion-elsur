import React from 'react';
import { useTheme } from '../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables adaptativas según el tema
  const containerBg = isDark ? '#1d1d1d' : '#f1f5f9';
  const containerBorder = isDark ? '#2d2d30' : '#cbd5e1';
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
      <div className="col-md-4">
        <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
          Filtrar por Nombre / Contacto:
        </label>
        <input 
          type="text" 
          className={`form-control ${inputTextColor} py-2`}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
          placeholder="Buscar proveedor..." 
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
      </div>
      
      <div className="col-md-4">
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
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label small font-monospace fw-semibold" style={{ color: mutedText }}>
          Filtrar por Tipo:
        </label>
        <select 
          className={`form-select ${inputTextColor} py-2`}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
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