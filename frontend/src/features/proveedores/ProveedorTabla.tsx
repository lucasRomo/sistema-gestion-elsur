import React from 'react';
import type { Proveedor } from '../../types/Proveedor';
import { useTheme } from '../../Context/ThemeContext';

interface ProveedorTablaProps {
  proveedores: Proveedor[];
  onEditar: (proveedor: Proveedor) => void;
  onVerUbicacion: (proveedor: Proveedor) => void; 
}

export const ProveedorTabla: React.FC<ProveedorTablaProps> = ({ proveedores, onEditar, onVerUbicacion }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const containerBg = isDark ? '#1b1b1b' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const theadBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const rowBorder = isDark ? '#2d2d30' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  return (
    <div 
      className="table-responsive rounded-3 shadow-sm mb-4 font-monospace" 
      style={{ 
        backgroundColor: containerBg,
        border: `1px solid ${theadBorder}`,
        maxHeight: '65vh', 
        overflowY: 'auto' 
      }}
    >
      <table 
        className="table table-borderless align-middle m-0" 
        style={{ 
          color: tableText,
          backgroundColor: 'transparent',
          '--bs-table-bg': 'transparent',
          '--bs-table-color': tableText
        } as React.CSSProperties}
      >
        <thead>
          <tr 
            style={{ 
              borderBottom: `2px solid ${theadBorder}`, 
              backgroundColor: containerBg,
              fontSize: '0.85rem'
            }}
            className="text-uppercase fw-bold text-muted"
          >
            <th className="py-3 px-3 text-center">ID</th>
            <th className="py-3 px-3">Nombre Comercial</th>
            <th className="py-3 px-3">Contacto</th>
            <th className="py-3 px-3">Email</th>
            <th className="py-3 px-3 text-center">Estado</th>
            <th className="py-3 px-3">Tipo de Proveedor</th>
            <th className="py-3 px-3 text-center">Opciones</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {proveedores.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-5" style={{ color: mutedText }}>
                No se encontraron proveedores registrados en el sistema.
              </td>
            </tr>
          ) : (
            proveedores.map((prov) => (
              <tr 
                key={prov.idProveedor} 
                style={{ borderBottom: `1px solid ${rowBorder}`, transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td className="py-3 px-3 fw-bold text-center text-info">
                  #{prov.idProveedor}
                </td>
                <td className="py-3 px-3 fw-bold">
                  {prov.nombreComercial}
                </td>
                <td className="py-3 px-3">
                  {prov.contactoNombre || '—'}
                </td>
                <td className="py-3 px-3">
                  {prov.emailContacto ? (
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${prov.emailContacto}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`${isDark ? 'text-info' : 'text-primary'} text-decoration-none d-inline-flex align-items-center gap-1 fw-semibold`} 
                      title={`Enviar correo a ${prov.nombreComercial} via Gmail`}
                    >
                      <i className="bi bi-envelope small"></i> {prov.emailContacto}
                    </a>
                  ) : ( 
                    <span style={{ color: mutedText }}>—</span> 
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <span 
                    className={`badge px-3 py-2 text-uppercase fw-bold rounded-pill ${
                      prov.estado === 'Activo' ? 'bg-success' : 'bg-danger'
                    }`}
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    {prov.estado}
                  </span>
                </td>
                <td className="py-3 px-3" style={{ color: isDark ? '#e4e4e7' : '#334155' }}>
                  {prov.tipoProveedor?.descripcion || 'General'}
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      onClick={() => onEditar(prov)}
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2"
                      style={{ width: '32px', height: '32px' }}
                      title="Modificar Proveedor"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button 
                      onClick={() => onVerUbicacion(prov)}
                      className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2"
                      style={{ width: '32px', height: '32px' }}
                      title="Ver Ubicación"
                    >
                      <i className="bi bi-house-door"></i>
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