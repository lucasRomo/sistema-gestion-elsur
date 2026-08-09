import React from 'react';
import type { Maquina } from '../types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Estilos adaptativos
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textSubtle = isDark ? '#a1a1aa' : '#64748b';
  const headerBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const rowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const hoverBg = isDark ? '#27272a' : '#f8fafc';

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
      <table style={{ width: '100%', borderCollapse: 'collapse', color: textColor }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${headerBorder}`, textAlign: 'left' }}>
            <th style={{ padding: '12px', color: textColor }}>ID</th>
            <th style={{ padding: '12px', color: textColor }}>Nombre del Equipo</th>
            <th style={{ padding: '12px', color: textColor }}>Estado Actual</th>
            <th style={{ padding: '12px', textAlign: 'center', color: textColor }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {maquinas.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4" style={{ color: textSubtle }}>
                No se encontraron equipos registrados en el sistema.
              </td>
            </tr>
          ) : (
            maquinas.map((maq) => (
              <tr 
                key={maq.idMaquina} 
                style={{ borderBottom: `1px solid ${rowBorder}`, transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px', color: textSubtle }} className="fw-bold">#{maq.idMaquina}</td>
                <td style={{ padding: '12px', color: textColor }} className="fw-semibold">{maq.nombre}</td>
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
                      style={{ width: '32px', height: '32px', color: isDark ? '#ffc107' : '#d97706', borderColor: isDark ? '#ffc107' : '#d97706' }}
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