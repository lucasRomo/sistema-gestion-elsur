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
  return (
    <div className="row g-3 mb-4 p-3 rounded d-print-none" style={{ backgroundColor: isDark ? '#1d1d1d' : '#f1f5f9', border: `1px solid ${isDark ? '#2d2d30' : '#cbd5e1'}` }}>
      <div className="col-md-7">
        <label className="form-label small text-secondary fw-bold">Filtro por Cliente, Empleado o Fecha:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary" 
          placeholder="Escribí cliente, empleado o fecha (ej: 'Juan', 'Martina' o '14/07/2026')..." 
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>
      <div className="col-md-5">
        <label className="form-label small text-secondary fw-bold">Estado:</label>
        <select 
          className="form-select bg-dark text-white border-secondary"
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