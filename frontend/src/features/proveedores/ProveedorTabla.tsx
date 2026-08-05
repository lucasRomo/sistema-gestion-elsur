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

  // Variables adaptativas según el tema
  const textColor = isDark ? 'text-white' : 'text-dark';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const tableHeaderBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const tableRowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const hoverRowBg = isDark ? '#27272a' : '#f1f5f9';

  return (
    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
      <table className={textColor} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${tableHeaderBorder}`, textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Nombre Comercial</th>
            <th style={{ padding: '12px' }}>Contacto</th>
            <th style={{ padding: '12px' }}>Email</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px' }}>Tipo de Proveedor</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.length === 0 ? (
            <tr>
              <td colSpan={7} className={`text-center py-4 ${textColor}`}>
                No se encontraron proveedores registrados en el sistema.
              </td>
            </tr>
          ) : (
            proveedores.map((prov) => (
              <tr 
                key={prov.idProveedor} 
                style={{ borderBottom: `1px solid ${tableRowBorder}`, transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverRowBg} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px', color: mutedText }} className="fw-bold">{prov.idProveedor}</td>
                <td style={{ padding: '12px' }} className="fw-semibold">{prov.nombreComercial}</td>
                <td style={{ padding: '12px' }}>{prov.contactoNombre || '—'}</td>
                <td style={{ padding: '12px' }}>
                  {prov.emailContacto ? (
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${prov.emailContacto}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`${isDark ? 'text-info' : 'text-primary'} text-decoration-none d-inline-flex align-items-center gap-1`} 
                      title={`Enviar correo a ${prov.nombreComercial} via Gmail`}
                    >
                      <i className="bi bi-envelope small"></i> {prov.emailContacto}
                    </a>
                  ) : ( 
                    <span style={{ color: mutedText }}>—</span> 
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <span className={`badge ${prov.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                    {prov.estado}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{prov.tipoProveedor?.descripcion || 'General'}</td>
                <td style={{ padding: '12px' }}>
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      onClick={() => onEditar(prov)}
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                      title="Modificar Proveedor"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button 
                      onClick={() => onVerUbicacion(prov)}
                      className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
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