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

  // Variables cromáticas adaptativas estandarizadas
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#f8f8f8' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const noMachineColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';

  // Ordenamos la lista por idProducto de menor a mayor
  const productosOrdenados = [...productos].sort((a, b) => (a.idProducto ?? 0) - (b.idProducto ?? 0));

  return (
    <table 
      className="table-hover m-0 align-middle w-100" 
      style={{ 
        borderCollapse: 'collapse', 
        color: tableText,
        backgroundColor: tableBg 
      }}
    >
      <thead style={{ position: 'sticky', top: 0, backgroundColor: theadBg, zIndex: 1 }}>
        <tr style={{ backgroundColor: theadBg, borderBottom: `2px solid ${theadBorder}`, color: theadText, fontSize: '0.85rem', textTransform: 'uppercase' }}>
          <th className="py-3 px-3 text-center" style={{ width: '6%' }}>ID</th>
          <th className="py-3 px-3 text-start" style={{ width: '22%' }}>Nombre</th>
          <th className="py-3 px-3 text-center" style={{ width: '14%' }}>Categoría</th>
          <th className="py-3 px-3 text-center" style={{ width: '12%' }}>Precio</th>
          <th className="py-3 px-3 text-center" style={{ width: '12%' }}>Stock</th>
          <th className="py-3 px-3 text-center" style={{ width: '14%' }}>Máquina</th>
          <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Estado</th>
          <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Opciones</th>
        </tr>
      </thead>
      <tbody style={{ fontSize: '0.9rem' }}>
        {productosOrdenados && productosOrdenados.length > 0 ? (
          productosOrdenados.map((p) => (
            <tr 
              key={p.idProducto}
              style={{ borderBottom: `1px solid ${rowBorder}` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td className="px-3 py-3 text-center text-info fw-bold">#{p.idProducto}</td>
              <td className="px-3 py-3 fw-bold text-start" style={{ color: tableText }}>{p.nombreProducto}</td>
              <td className="px-3 py-3 text-center" style={{ color: tableText }}>{p.categoria?.nombre || '-'}</td>
              <td className="px-3 py-3 text-center fw-semibold text-info">${Number(p.precioBase).toFixed(2)}</td>
              <td className="px-3 py-3 text-center">
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
                className="px-3 py-3 text-center" 
                style={{ color: p.maquinaNecesaria ? (isDark ? '#ffc107' : '#d97706') : noMachineColor }}
              >
                {p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina || 'No aplica'}
              </td>
              <td className="px-3 py-3 text-center">
                <span className={`badge rounded-pill px-3 py-2 ${p.estado === 'Activo' ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75'}`} style={{ color: '#ffffff' }}>
                  {p.estado}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <div className="d-flex justify-content-center gap-2">
                  {/* Botón Toggle Vínculo de Stock */}
                  {onToggleStockVinculado && (
                    <button 
                      className={`btn btn-sm d-flex align-items-center justify-content-center rounded-2 ${
                        p.stockVinculado 
                        ? 'btn-info text-dark fw-bold' 
                        : 'btn-outline-secondary'
                      }`} 
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onToggleStockVinculado(p)}
                      title={p.stockVinculado ? "Stock vinculado a insumos (Activado)" : "Vincular stock a insumos (Desactivado)"}
                    >
                      <i className="bi bi-link-45deg fs-5"></i>
                    </button>
                  )}
                  
                  {/* Botón Editar Producto */}
                  <button 
                    className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => onEditar(p)}
                    title="Editar Producto"
                  >
                    <i className="bi bi-pencil-square fs-6"></i>
                  </button>

                  {/* Botón Configurar Receta / Insumos */}
                  {onConfigurarReceta && (
                    <button 
                      className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
                      style={{ width: '32px', height: '32px' }}
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
            <td colSpan={8} className="text-center py-5 border-0" style={{ color: tableText }}>
              <i className="bi display-5 d-block mb-2 opacity-50"></i>
              <span className="font-monospace">No se han registrado o encontrado productos en el sistema.</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};