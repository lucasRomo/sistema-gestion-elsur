import React from 'react';

interface FiltrosPedidosProps {
  filtroCliente: string;
  setFiltroCliente: (value: string) => void;
  filtroEstado: string;
  setFiltroEstado: (value: string) => void;
  filtroEmpleado: string;
  setFiltroEmpleado: (value: string) => void;
  empleados: any[];
  isDarkMode?: boolean;
}

export const FiltrosPedidos: React.FC<FiltrosPedidosProps> = ({
  filtroCliente,
  setFiltroCliente,
  filtroEstado,
  setFiltroEstado,
  filtroEmpleado,
  setFiltroEmpleado,
  empleados,
  isDarkMode = true 
}) => {
  // Estilos dinámicos según el modo
  const containerBg = isDarkMode ? '#1d1d1d' : '#f1f5f9';
  const containerBorder = isDarkMode ? '#334155' : '#cbd5e1';
  const labelColorClass = isDarkMode ? 'text-light' : 'text-dark';
  const inputBg = isDarkMode ? '#121214' : '#ffffff';
  const inputTextColor = isDarkMode ? 'text-white' : 'text-dark';
  const inputBorder = isDarkMode ? 'border-secondary' : 'border-secondary';

  return (
    <div 
      className="row g-3 p-3 rounded d-print-none align-items-end shadow" 
      style={{ 
        backgroundColor: containerBg, 
        border: `1px solid ${containerBorder}`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      
      {/* 1. Buscar por Cliente */}
      <div className="col-md-4">
        <label className={`form-label small fw-semibold mb-1 ${labelColorClass}`}>
          Buscar por Cliente:
        </label>
        <input 
          type="text" 
          className={`form-control ${inputTextColor} ${inputBorder} font-monospace`} 
          placeholder="Escribí el nombre..." 
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          style={{ backgroundColor: inputBg }}
        />
      </div>

      {/* 2. Filtrar por Estado Operativo */}
      <div className="col-md-4">
        <label className={`form-label small fw-semibold mb-1 ${labelColorClass}`}>
          Filtrar por Estado Operativo:
        </label>
        <select 
          className={`form-select ${inputTextColor} ${inputBorder} font-monospace`}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ backgroundColor: inputBg }}
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
        <label className={`form-label small fw-semibold mb-1 ${labelColorClass}`}>
          Filtrar por Empleado Asignado:
        </label>
        <select 
          className={`form-select ${inputTextColor} ${inputBorder} font-monospace`}
          value={filtroEmpleado}
          onChange={(e) => setFiltroEmpleado(e.target.value)}
          style={{ backgroundColor: inputBg }}
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