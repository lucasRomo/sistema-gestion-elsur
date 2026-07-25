import React from 'react';

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
  empleados
}) => {
  return (
    <div className="row g-3 p-3 rounded d-print-none align-items-end" style={{ backgroundColor: '#1d1d1d', border: '1px solid #2d2d30' }}>
      
      {/* 1. Buscar por Cliente */}
      <div className="col-md-4">
        <label className="form-label small text-secondary fw-bold mb-1">Buscar por Cliente:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary" 
          placeholder="Escribí el nombre..." 
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />
      </div>

      {/* 2. Filtrar por Estado Operativo */}
      <div className="col-md-4">
        <label className="form-label small text-secondary fw-bold mb-1">Filtrar por Estado Operativo:</label>
        <select 
          className="form-select bg-dark text-white border-secondary"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los activos (Taller)</option>
          <option value="PRESUPUESTO">PRESUPUESTOS</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN PROCESO">EN PROCESO</option>
          <option value="PAUSADO">PAUSADO</option>
          <option value="CANCELADO">CANCELADO</option>
          <option value="FINALIZADO">FINALIZADO</option>
        </select>
      </div>

      {/* 3. Filtrar por Empleado Asignado */}
      <div className="col-md-4">
        <label className="form-label small text-secondary fw-bold mb-1">Filtrar por Empleado Asignado:</label>
        <select 
          className="form-select bg-dark text-white border-secondary font-monospace"
          value={filtroEmpleado}
          onChange={(e) => setFiltroEmpleado(e.target.value)}
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