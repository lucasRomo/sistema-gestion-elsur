import React from 'react';
import type { Proveedor } from '../types/Proveedor';
import { useTheme } from '../../../Context/ThemeContext';

interface ProveedorTablaProps {
  proveedores: Proveedor[];
  onEditar: (proveedor: Proveedor) => void;
  onVerUbicacion: (proveedor: Proveedor) => void; 
}

export const ProveedorTabla: React.FC<ProveedorTablaProps> = ({ proveedores, onEditar, onVerUbicacion }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tableWrapperBg = isDark ? '#1d1d1d' : '#f8fafc';
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#ffffff' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  return (
    <div 
      className="d-flex flex-column flex-grow-1 overflow-hidden mb-2 shadow-sm rounded-3 border font-monospace" 
      style={{ 
        backgroundColor: tableWrapperBg, 
        borderColor: theadBorder,
        height: '66vh'
      }}
    >
      <div 
        className="table-responsive flex-grow-1" 
        style={{ backgroundColor: tableWrapperBg, height: '100%', overflowY: 'auto' }}
      >
        <table 
          className="table-hover m-0 align-middle"
          style={{ width: '100%', borderCollapse: 'collapse', color: tableText, backgroundColor: tableBg }}
        >
          <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
            <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${theadBorder}`, color: theadText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th className="py-3 px-3 text-center">ID</th>
              <th className="py-3 px-3 text-start">Nombre Comercial</th>
              <th className="py-3 px-3 text-start">Contacto</th>
              <th className="py-3 px-3 text-start">Email</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-start">Tipo de Proveedor</th>
              <th className="py-3 px-3 text-center">Opciones</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.9rem' }}>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5" style={{ color: '#ffffff' }}>
                  No se encontraron proveedores registrados en el sistema.
                </td>
              </tr>
            ) : (
              proveedores.map((prov) => (
                <tr 
                  key={prov.idProveedor} 
                  style={{ borderBottom: `1px solid ${rowBorder}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="py-3 px-3 fw-bold text-center text-info">
                    #{prov.idProveedor}
                  </td>
                  <td className="py-3 px-3 fw-bold text-start">
                    {prov.nombreComercial}
                  </td>
                  <td className="py-3 px-3 text-start">
                    {prov.contactoNombre || '—'}
                  </td>
                  <td className="py-3 px-3 text-start">
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
                  <td className="py-3 px-3 text-start" style={{ color: isDark ? '#e4e4e7' : '#334155' }}>
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
    </div>
  );
};