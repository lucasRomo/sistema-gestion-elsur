import React from 'react';
import type { Producto } from '../../types/Producto';
import { useTheme } from '../../Context/ThemeContext';

interface Props {
  productos: Producto[];
  onEditar: (p: Producto) => void;
}

export const ProductoTabla: React.FC<Props> = ({ productos, onEditar }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de color segun el tema activo
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const theadBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const rowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const rowHoverBg = isDark ? '#27272a' : '#f1f5f9';
  const emptyTextColor = isDark ? 'text-white' : 'text-dark';

  return (
    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: tableText }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${theadBorder}`, textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Nombre</th>
            <th style={{ padding: '12px' }}>Categoría</th>
            <th style={{ padding: '12px' }}>Precio</th>
            <th style={{ padding: '12px' }}>Stock</th>
            <th style={{ padding: '12px' }}>Máquina</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {productos && productos.length > 0 ? (
            productos.map(p => (
              <tr 
                key={p.idProducto}
                style={{ borderBottom: `1px solid ${rowBorder}`, transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px' }}>{p.idProducto}</td>
                <td style={{ padding: '12px' }} className="fw-bold">{p.nombreProducto}</td>
                <td style={{ padding: '12px' }}>{p.categoria?.nombre || '-'}</td>
                <td style={{ padding: '12px' }} className="text-info">${Number(p.precioBase).toFixed(2)}</td>
                <td style={{ padding: '12px' }} className={p.stock > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                  {p.stock}
                </td>
                <td style={{ padding: '12px' }} className="text-warning">No disponible</td>
                <td style={{ padding: '12px' }}>
                  <span className={`badge ${p.estado === 'Activo' ? 'bg-success' : 'bg-danger'}`}>
                    {p.estado}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div className="d-flex justify-content-center">
                    <button 
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center" 
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onEditar(p)}
                      title="Editar Producto"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className={`text-center py-5 ${emptyTextColor}`}>
                <i className="bi display-6 d-block mb-2 text-secondary"></i>
                No se han Registrado o Encontrado Productos en el sistema
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};