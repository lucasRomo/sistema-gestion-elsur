import React from 'react';
import type { Insumo } from '../../types/Insumo';
import { useTheme } from '../../Context/ThemeContext';

interface InsumoTablaProps {
  insumos: Insumo[];
  onEditar: (insumo: Insumo) => void;
  onVerProveedores: (insumo: Insumo) => void;
}

export const InsumoTabla: React.FC<InsumoTablaProps> = ({ insumos, onEditar, onVerProveedores }) => {
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
              backgroundColor:'containerBg',
              fontSize: '0.85rem'
            }}
            className="text-uppercase fw-bold text-muted"
          >
            <th className="py-3 px-3 text-center">ID</th>
            <th className="py-3 px-3">Nombre Insumo</th>
            <th className="py-3 px-3 text-center">Stock Mínimo</th>
            <th className="py-3 px-3 text-center">Stock Actual</th>
            <th className="py-3 px-3">Tipo de Proveedor</th>
            <th className="py-3 px-3 text-center">Estado</th>
            <th className="py-3 px-3 text-center">Opciones</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {insumos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-5" style={{ color: mutedText }}>
                No se han registrado o encontrado insumos en el sistema.
              </td>
            </tr>
          ) : (
            insumos.map((i) => {
              const tieneBajoStock = i.stockActual <= i.stockMinimo;
              
              return (
                <tr 
                  key={i.idInsumo}
                  style={{ borderBottom: `1px solid ${rowBorder}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* ID con estilo cian (#) similar a Historial de Pedidos */}
                  <td className="py-3 px-3 fw-bold text-center text-info-custom">
                    #{i.idInsumo}
                  </td>
                  
                  <td className="py-3 px-3 fw-bold">
                    {i.nombreInsumo}
                  </td>
                  
                  <td className="py-3 px-3 text-center text-warning fw-bold">
                    {i.stockMinimo}
                  </td>
                  
                  <td className={`py-3 px-3 text-center fw-bold ${tieneBajoStock ? 'text-danger' : 'text-success'}`}>
  {i.stockActual} {tieneBajoStock && <i className="bi bi-exclamation-circle-fill text-danger ms-1" title="Stock por debajo del mínimo"></i>}
</td>
                  
                  <td className="py-3 px-3" style={{ color: isDark ? '#e4e4e7' : '#334155' }}>
                    {i.proveedor?.tipoProveedor?.descripcion || '-'}
                  </td>
                  
                  {/* Badges de estado con estilos redondeados */}
                  <td className="py-3 px-3 text-center">
                    <span 
                      className={`badge px-3 py-2 text-uppercase fw-bold rounded-pill ${
                        i.estado === 'Activo' ? 'bg-success' : 'bg-danger'
                      }`}
                      style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                    >
                      {i.estado}
                    </span>
                  </td>
                  
                  {/* Acciones */}
                  <td className="py-3 px-3 text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onEditar(i)} 
                        title="Editar Insumo"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      
                      <button 
                        className="btn btn-sm d-flex align-items-center justify-content-center btn-truck-custom rounded-2" 
                        style={{ width: '32px', height: '32px' }} 
                        onClick={() => onVerProveedores(i)} 
                        title="Ver Proveedores del rubro"
                      >
                        <i className="bi bi-truck"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};