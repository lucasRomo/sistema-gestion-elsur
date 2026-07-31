import React from 'react';
import type { Proveedor } from '../../types/Proveedor';

interface ProveedorTablaProps {
  proveedores: Proveedor[];
  onEditar: (proveedor: Proveedor) => void;
  onVerUbicacion: (proveedor: Proveedor) => void; 
}

export const ProveedorTabla: React.FC<ProveedorTablaProps> = ({ proveedores, onEditar, onVerUbicacion }) => {
  return (
    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
      {/* Eliminamos el background color del thead y aseguramos el mismo padding */}
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #3f3f46', textAlign: 'left' }}>
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
              <td colSpan={7} className="text-center py-4">
                No se encontraron proveedores registrados en el sistema.
              </td>
            </tr>
          ) : (
            proveedores.map((prov) => (
              <tr 
                key={prov.idProveedor} 
                style={{ borderBottom: '1px solid #2d2d30' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px' }} className="fw-bold text-white-50">{prov.idProveedor}</td>
                <td style={{ padding: '12px' }} className="fw-semibold text-white">{prov.nombreComercial}</td>
                <td style={{ padding: '12px' }}>{prov.contactoNombre || '—'}</td>
                <td style={{ padding: '12px' }}>{prov.emailContacto ? ( <a href={`mailto:${prov.emailContacto}`} 
                className="text-info text-decoration-none d-inline-flex align-items-center gap-1" title={`Enviar correo a ${prov.nombreComercial}`}>
                <i className="bi bi-envelope small"></i> {prov.emailContacto} </a> ) : ( <span className="text-muted">—</span> )} </td>
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