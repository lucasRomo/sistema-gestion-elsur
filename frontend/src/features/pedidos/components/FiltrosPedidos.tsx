import React from 'react';

interface FiltrosPedidosProps {
  filtroCliente: string;
  setFiltroCliente: (value: string) => void;
  filtroEstado: string;
  setFiltroEstado: (value: string) => void;
}

export const FiltrosPedidos: React.FC<FiltrosPedidosProps> = ({
  filtroCliente,
  setFiltroCliente,
  filtroEstado,
  setFiltroEstado,
}) => {
  return (
    <div className="row g-3 mb-4 p-3 rounded d-print-none" style={{ backgroundColor: '#1a1a1c', border: '1px solid #2d2d30' }}>
      <div className="col-md-6">
        <label className="form-label small text-secondary fw-bold">Buscar por Cliente:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary" 
          placeholder="Escribí el nombre del cliente..." 
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label small text-secondary fw-bold">Filtrar por Estado Operativo:</label>
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
    </div>
  );
};