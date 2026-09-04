import React from 'react';
import type { Maquina } from '../types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

interface MaquinaTablaProps {
  maquinas: Maquina[];
  onEditar: (maquina: Maquina) => void;
  onVerIncidencias: (maquina: Maquina) => void;
}

export const MaquinaTabla: React.FC<MaquinaTablaProps> = ({ 
  maquinas, 
  onEditar, 
  onVerIncidencias 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tableWrapperBg = isDark ? '#1d1d1d' : '#f8fafc';
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#fafafa' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';

  // Ordenamos las máquinas por ID de forma ascendente
  const maquinasOrdenadas = [...maquinas].sort((a, b) => (a.idMaquina ?? 0) - (b.idMaquina ?? 0));

  const renderBadgeEstado = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'OPERATIVA':
        return <span className="badge bg-success bg-opacity-75 text-white fw-bold px-3 py-2"><i className="bi bi-check-circle me-1"></i>OPERATIVA</span>;
      case 'FUERA DE SERVICIO':
      case 'FALLA':
        return <span className="badge bg-danger bg-opacity-75 text-white fw-bold px-3 py-2"><i className="bi bi-exclamation-octagon me-1"></i>FUERA DE SERVICIO</span>;
      case 'MANTENIMIENTO':
        return <span className="badge bg-warning bg-opacity-75 text-dark fw-bold px-3 py-2"><i className="bi bi-tools me-1"></i>MANTENIMIENTO</span>;
      default:
        return <span className="badge bg-secondary text-white px-3 py-2">{estado}</span>;
    }
  };

  return (
    <table 
      className="table-hover m-0 align-middle w-100" 
      style={{ borderCollapse: 'collapse', color: tableText, backgroundColor: tableBg }}
    >
      <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
        <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${theadBorder}`, color: theadText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
          <th className="py-3 px-3 text-center" style={{ width: '10%' }}>ID</th>
          <th className="py-3 px-3 text-start" style={{ width: '35%' }}>Nombre del Equipo</th>
          <th className="py-3 px-3 text-center" style={{ width: '20%' }}>Estado Operativo</th>
          <th className="py-3 px-3 text-center" style={{ width: '20%' }}>Disponibilidad</th>
          <th className="py-3 px-3 text-center" style={{ width: '15%' }}>Opciones</th>
        </tr>
      </thead>
      <tbody style={{ fontSize: '0.9rem' }}>
        {maquinasOrdenadas.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-5 border-0" style={{ color: tableText }}>
              <i className="bi display-5 d-block mb-2 opacity-50"></i>
              <span>No se encontraron equipos registrados en el sistema.</span>
            </td>
          </tr>
        ) : (
          maquinasOrdenadas.map((maq, index) => (
            <tr 
              key={maq.idMaquina} 
              style={{ borderBottom: index === maquinasOrdenadas.length - 1 ? 'none' : `1px solid ${rowBorder}`, opacity: maq.activo === false ? 0.6 : 1 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td className="py-3 px-3 text-center text-info-custom fw-bold">#{maq.idMaquina}</td>
              <td className="py-3 px-3 fw-semibold text-start" style={{ color: tableText }}>{maq.nombre}</td>
              <td className="py-3 px-3 text-center">
                {renderBadgeEstado(maq.estado)}
              </td>
              <td className="text-center align-middle">
                {maq.activo ? (
                  <span className="badge bg-success text-white px-2 py-1">
                    <i className="bi bi-toggle-on me-1"></i> ACTIVO
                  </span>
                ) : (
                  <span className="badge bg-danger text-white px-2 py-1">
                    <i className="bi bi-toggle-off me-1"></i> INACTIVO
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-center">
                <div className="d-flex justify-content-center gap-2">
                  <button 
                    onClick={() => onVerIncidencias(maq)}
                    className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '34px', height: '34px' }}
                    title="Ver Historial de Incidencias"
                  >
                    <i className="bi bi-clock-history"></i>
                  </button>

                  <button 
                    onClick={() => onEditar(maq)}
                    className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2"
                    style={{ width: '34px', height: '34px' }}
                    title="Modificar Equipo"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};