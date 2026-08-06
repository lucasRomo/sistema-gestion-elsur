import React from 'react';
import type { Maquina } from '../../types/Maquina';

interface MaquinaTablaProps {
  maquinas: Maquina[];
  onEditar: (maquina: Maquina) => void;
  onVerIncidencias: (maquina: Maquina) => void;
  onEliminar: (idMaquina: number) => void;
}

export const MaquinaTabla: React.FC<MaquinaTablaProps> = ({ 
  maquinas, 
  onEditar, 
  onVerIncidencias, 
  onEliminar 
}) => {

  const renderBadgeEstado = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'OPERATIVA':
        return <span className="badge bg-success text-white fw-bold"><i className="bi bi-check-circle me-1"></i>OPERATIVA</span>;
      case 'FUERA DE SERVICIO':
      case 'FALLA':
        return <span className="badge bg-danger text-white fw-bold"><i className="bi bi-exclamation-octagon me-1"></i>FUERA DE SERVICIO</span>;
      case 'MANTENIMIENTO':
        return <span className="badge bg-warning text-dark fw-bold"><i className="bi bi-tools me-1"></i>MANTENIMIENTO</span>;
      default:
        return <span className="badge bg-secondary text-white">{estado}</span>;
    }
  };

  return (
    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Nombre del Equipo</th>
            <th style={{ padding: '12px' }}>Estado Actual</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {maquinas.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4 text-white-50">
                No se encontraron equipos registrados en el sistema.
              </td>
            </tr>
          ) : (
            maquinas.map((maq) => (
              <tr 
                key={maq.idMaquina} 
                style={{ borderBottom: '1px solid #2d2d30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px' }} className="fw-bold text-white-50">#{maq.idMaquina}</td>
                <td style={{ padding: '12px' }} className="fw-semibold text-white">{maq.nombre}</td>
                <td style={{ padding: '12px' }}>
                  {renderBadgeEstado(maq.estado)}
                </td>
                <td style={{ padding: '12px' }}>
                  <div className="d-flex justify-content-center gap-2">
                    {/* Ver Historial de Incidencias */}
                    <button 
                      onClick={() => onVerIncidencias(maq)}
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                      title="Ver Historial de Incidencias"
                    >
                      <i className="bi bi-clock-history"></i>
                    </button>

                    {/* Editar Equipo */}
                    <button 
                      onClick={() => onEditar(maq)}
                      className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', color: '#ffc107', borderColor: '#ffc107' }}
                      title="Modificar Equipo"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>

                    {/* Eliminar Equipo */}
                    <button 
                      onClick={() => maq.idMaquina && onEliminar(maq.idMaquina)}
                      className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                      title="Eliminar Equipo"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};