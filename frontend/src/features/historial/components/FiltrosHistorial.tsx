import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

interface FiltrosHistorialProps {
  filtroTexto: string;
  setFiltroTexto: (value: string) => void;
  filtroEstadoHistorial: string;
  setFiltroEstadoHistorial: (value: string) => void;
}

export const FiltrosHistorial: React.FC<FiltrosHistorialProps> = ({
  filtroTexto,
  setFiltroTexto,
  filtroEstadoHistorial,
  setFiltroEstadoHistorial,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const containerBg = isDark ? '#1d1d1d' : '#f8fafc';
  const containerBorder = isDark ? '#2d2d30' : '#cbd5e1';
  const labelColor = isDark ? '#a1a1aa' : '#475569';
  const inputBg = isDark ? '#1d1d1d' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const inputText = isDark ? '#ffffff' : '#0f172a';

  return (
    <div 
      className="row g-3 mb-4 p-3 rounded d-print-none shadow-sm" 
      style={{ backgroundColor: containerBg, border: `1px solid ${containerBorder}` }}
    >
      <div className="col-md-7">
        <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
          Filtro por Cliente, Empleado o Fecha:
        </label>
        <input 
          type="text" 
          className="form-control shadow-none" 
          style={{ 
            backgroundColor: inputBg, 
            color: inputText, 
            borderColor: inputBorder 
          }}
          placeholder="Escribí cliente, empleado o fecha (ej: 'Juan', 'Martina' o '14/07/2026')..." 
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>

      <div className="col-md-5">
        <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
          Estado:
        </label>
        <select 
          className="form-select shadow-none"
          style={{ 
            backgroundColor: inputBg, 
            color: inputText, 
            borderColor: inputBorder 
          }}
          value={filtroEstadoHistorial}
          onChange={(e) => setFiltroEstadoHistorial(e.target.value)}
        >
          <option value="TODOS">Todos los concluidos (Cerrados)</option>
          <option value="ENTREGADO">ENTREGADOS</option>
          <option value="CANCELADO">CANCELADOS</option>
        </select>
      </div>
    </div>
  );
};