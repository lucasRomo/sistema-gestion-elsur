import React from 'react';
import type { Proveedor } from '../../types/Proveedor';

interface ProveedorTablaProps {
  proveedores: Proveedor[];
  onEditar: (proveedor: Proveedor) => void;
  onVerUbicacion: (proveedor: Proveedor) => void; // Cambiado para manejar la ubicación
}

export const ProveedorTabla: React.FC<ProveedorTablaProps> = ({ proveedores, onEditar, onVerUbicacion }) => {
  return (
    <div className="table-responsive rounded" style={{ border: '1px solid #2d2d30', backgroundColor: '#1a1a1c' }}>
      <table className="table table-dark table-hover mb-0 align-middle">
        <thead style={{ backgroundColor: '#222226' }}>
          <tr className="font-monospace text-white-50" style={{ fontSize: '0.9rem' }}>
            <th className="ps-3">ID</th>
            <th>Nombre Comercial</th>
            <th>Contacto</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Tipo de Proveedor</th>
            <th className="text-center">Opciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted py-4">
                No se encontraron proveedores registrados en el sistema.
              </td>
            </tr>
          ) : (
            proveedores.map((prov) => (
              <tr key={prov.idProveedor} style={{ borderBottom: '1px solid #2d2d30' }}>
                <td className="ps-3 fw-bold text-white-50">{prov.idProveedor}</td>
                <td className="fw-semibold text-white">{prov.nombreComercial}</td>
                <td>{prov.contactoNombre || '—'}</td>
                <td className="text-info">{prov.emailContacto || '—'}</td>
                <td>
                  <span className={`badge ${prov.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border`}>
                    {prov.estado}
                  </span>
                </td>
                <td>{prov.tipoProveedor?.descripcion || 'General'}</td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    {/* Botón de Modificar */}
                    <button 
                      onClick={() => onEditar(prov)}
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                      title="Modificar Proveedor"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    {/* NUEVO: Botón de Ubicación igual a Clientes */}
                    <button 
                      onClick={() => onVerUbicacion(prov)}
                      className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', color: '#ffc107', borderColor: '#ffc107' }}
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