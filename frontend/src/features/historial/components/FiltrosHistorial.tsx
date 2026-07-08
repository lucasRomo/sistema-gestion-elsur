import React from 'react';

interface FiltrosHistorialProps {
  filtroCliente: string;
  setFiltroCliente: (value: string) => void;
  filtroEstadoHistorial: string;
  setFiltroEstadoHistorial: (value: string) => void;
}

export const FiltrosHistorial: React.FC<FiltrosHistorialProps> = ({
  filtroCliente,
  setFiltroCliente,
  filtroEstadoHistorial,
  setFiltroEstadoHistorial,
}) => {
  return (
    <div className="row g-3 mb-4 p-3 rounded d-print-none" style={{ backgroundColor: '#1a1a1c', border: '1px solid #2d2d30' }}>
      <div className="col-md-6">
        <label className="form-label small text-secondary fw-bold">Buscar Cliente:</label>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary" 
          placeholder="Escribí el nombre del cliente..." 
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label small text-secondary fw-bold">Clasificación Histórica:</label>
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