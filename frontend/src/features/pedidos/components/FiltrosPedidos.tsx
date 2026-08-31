import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

interface FiltrosPedidosProps {
  filtroCliente: string;
  setFiltroCliente: (value: string) => void;
  filtroEstado: string;
  setFiltroEstado: (value: string) => void;
  filtroEmpleado: string;
  setFiltroEmpleado: (value: string) => void;
  empleados: any[];
}

export const FiltrosPedidos: React.FC<FiltrosPedidosProps> = ({
  filtroCliente,
  setFiltroCliente,
  filtroEstado,
  setFiltroEstado,
  filtroEmpleado,
  setFiltroEmpleado,
  empleados,
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
      className="row g-3 align-items-center mb-4 p-3 rounded-3 shadow-sm font-monospace d-print-none" 
      style={{ 
        backgroundColor: containerBg, 
        border: `1px solid ${containerBorder}`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      
      {/* 1. Buscar por Cliente */}
      <div className="col-md-4">
        <label className="form-label small fw-semibold" style={{ color: mutedText }}>
          Buscar por Cliente:
        </label>
        <input 
          type="text" 
          className={`form-control ${inputTextColor} py-2 font-monospace shadow-none`} 
          placeholder="Escribí el nombre..." 
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
        />
      </div>

      {/* 2. Filtrar por Estado Operativo */}
      <div className="col-md-4">
        <label className="form-label small fw-semibold" style={{ color: mutedText }}>
          Filtrar por Estado Operativo:
        </label>
        <select 
          className={`form-select ${inputTextColor} py-2 font-monospace shadow-none`}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
        >
          <option value="">Todos los activos (Taller)</option>
          <option value="PRESUPUESTO">PRESUPUESTOS</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN PROCESO">EN PROCESO</option>
          <option value="PAUSADO">PAUSADO</option>
          <option value="CANCELADO">CANCELADO</option>
          <option value="FINALIZADO">FINALIZADO</option>
          <option value="DEVUELTO">DEVUELTOS ↩</option>
        </select>
      </div>

      {/* 3. Filtrar por Empleado Asignado */}
      <div className="col-md-4">
        <label className="form-label small fw-semibold" style={{ color: mutedText }}>
          Filtrar por Empleado Asignado:
        </label>
        <select 
          className={`form-select ${inputTextColor} py-2 font-monospace shadow-none`}
          value={filtroEmpleado}
          onChange={(e) => setFiltroEmpleado(e.target.value)}
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
        >
          <option value="">Todos los Empleados</option>
          <option value="SIN_ASIGNAR">Sin Asignar</option>
          {empleados && empleados.map((emp) => {
            const idEmp = emp.idEmpleado || emp.id_empleado;
            const nombreEmp = emp.persona 
              ? `${emp.persona.nombre} ${emp.persona.apellido}` 
              : (emp.nombre || `Empleado #${idEmp}`);

            return (
              <option key={`filtro-emp-${idEmp}`} value={idEmp}>
                {nombreEmp}
              </option>
            );
          })}
        </select>
      </div>

    </div>
  );
};