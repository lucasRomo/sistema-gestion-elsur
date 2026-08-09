import React from 'react';
import type { Producto } from '../types/Producto';
import { useTheme } from '../../../Context/ThemeContext';

interface Props {
  productos: Producto[];
  onEditar: (p: Producto) => void;
  onConfigurarReceta?: (p: Producto) => void;
  onToggleStockVinculado?: (p: Producto) => void;
}

export const ProductoTabla: React.FC<Props> = ({ 
  productos, 
  onEditar, 
  onConfigurarReceta,
  onToggleStockVinculado 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables cromáticas adaptativas según tema activo
  const containerBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#ffffff' : '#0f172a';
  const tableBorder = isDark ? '#3f3f46' : '#e2e8f0';
  const theadBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const rowBorder = isDark ? '#2d2d30' : '#e2e8f0';
  const rowHoverBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const emptyTextColor = isDark ? 'text-white-50' : 'text-muted';
  const noMachineColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';

  return (
    <div 
      className="table-responsive rounded shadow-sm" 
      style={{ 
        maxHeight: '60vh', 
        overflowY: 'auto',
        backgroundColor: containerBg,
        border: `1px solid ${tableBorder}`,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <table 
        className="align-middle m-0" 
        style={{ 
          width: '100%',
          borderCollapse: 'separate', 
          borderSpacing: 0,
          color: tableText 
        }}
      >
        <thead>
          <tr style={{ borderBottom: `2px solid ${theadBorder}`, backgroundColor: isDark ? '#1d1d1d' : '#f1f5f9' }}>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>ID</th>
            <th className="py-3 px-1 font-monospace small" style={{ color: tableText }}>Nombre</th>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Categoría</th>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Precio</th>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Stock</th>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Máquina</th>
            <th className="py-3 px-3 font-monospace small" style={{ color: tableText }}>Estado</th>
            <th className="py-3 px-3 font-monospace small text-center" style={{ color: tableText }}>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {productos && productos.length > 0 ? (
            productos.map((p) => (
              <tr 
                key={p.idProducto}
                style={{ borderBottom: `1px solid ${rowBorder}`, transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td className="px-3 py-3 font-monospace small" style={{ color: tableText }}>{p.idProducto}</td>
                <td className="px-1 py-3 fw-bold" style={{ color: tableText }}>{p.nombreProducto}</td>
                <td className="px-3 py-3" style={{ color: tableText }}>{p.categoria?.nombre || '-'}</td>
                <td className="px-3 py-3 fw-semibold text-info">${Number(p.precioBase).toFixed(2)}</td>
                <td className="px-3 py-3">
                  <span className={p.stock > 0 ? "text-success fw-bold me-2" : "text-danger fw-bold me-2"}>
                    {p.stock}
                  </span>
                  {(p as any).stockVinculado && (
                    <span className="badge bg-info text-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                      Auto
                    </span>
                  )}
                </td>
                <td 
  className="px-3 py-3" 
  style={{ color: p.maquinaNecesaria ? (isDark ? '#ffc107' : '#d97706') : noMachineColor }}
>
  {p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina || 'No aplica'}
</td>
                <td className="px-3 py-3">
                  <span className={`badge rounded-pill px-3 py-2 ${p.estado === 'Activo' ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75'}`} style={{ color: '#ffffff' }}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="d-flex justify-content-center gap-2">
                    {/* Botón Toggle Vínculo de Stock */}
                    {onToggleStockVinculado && (
                      <button 
                        className={`btn btn-sm d-flex align-items-center justify-content-center rounded-2 ${
                          (p as any).stockVinculado 
                            ? 'btn-info text-dark fw-bold' 
                            : 'btn-outline-secondary'
                        }`} 
                        style={{ 
                          width: '34px', 
                          height: '34px'
                        }}
                        onClick={() => onToggleStockVinculado(p)}
                        title={(p as any).stockVinculado ? "Stock vinculado a insumos (Activado)" : "Vincular stock a insumos (Desactivado)"}
                      >
                        <i className="bi bi-link-45deg fs-5"></i>
                      </button>
                    )}

                    {/* Botón Editar Producto */}
                    <button 
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                      style={{ width: '34px', height: '34px' }}
                      onClick={() => onEditar(p)}
                      title="Editar Producto"
                    >
                      <i className="bi bi-pencil-square fs-6"></i>
                    </button>

                    {/* Botón Configurar Receta / Insumos */}
                    {onConfigurarReceta && (
                      <button 
                        className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
                        style={{ width: '34px', height: '34px' }}
                        onClick={() => onConfigurarReceta(p)}
                        title="Configurar Receta / Insumos"
                      >
                        <i className="bi bi-box-seam fs-6"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className={`text-center py-5 ${emptyTextColor}`}>
                <i className="bi bi-box-seam display-5 d-block mb-2 opacity-50"></i>
                <span className="font-monospace">No se han registrado o encontrado productos en el sistema</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};