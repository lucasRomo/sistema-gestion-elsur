import React from 'react';
import type { Producto } from '../types/Producto';
import { useTheme } from '../../../Context/ThemeContext';

import { formatearMonto } from '../../../utils/formato';
import { ThOrdenable } from '../../../components/common/ThOrdenable';
import { useOrdenTabla } from '../../../hook/useOrdenTabla';
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

  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#f8f8f8' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const noMachineColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';

  const { ordenados: productosOrdenados, orden, alternar } = useOrdenTabla(productos, {
    id: (p) => p.idProducto ?? 0,
    nombre: (p) => p.nombreProducto,
    categoria: (p) => p.categoria?.nombre,
    precio: (p) => Number(p.precioBase ?? 0),
    stock: (p) => Number(p.stock ?? 0),
    maquina: (p) => p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina,
    estado: (p) => p.estado,
  }, { clave: 'id', direccion: 'asc' });

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
          <ThOrdenable clave="id" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '6%' }}>ID</ThOrdenable>
          <ThOrdenable clave="nombre" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-start" style={{ width: '22%' }}>Nombre</ThOrdenable>
          <ThOrdenable clave="categoria" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '14%' }}>Categoría</ThOrdenable>
          <ThOrdenable clave="precio" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '12%' }}>Precio</ThOrdenable>
          <ThOrdenable clave="stock" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '12%' }}>Stock</ThOrdenable>
          <ThOrdenable clave="maquina" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '14%' }}>Máquina</ThOrdenable>
          <ThOrdenable clave="estado" orden={orden} onOrdenar={alternar} className="py-3 px-3 text-center" style={{ width: '10%' }}>Estado</ThOrdenable>
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
              <td className="px-3 py-3 text-center text-info-custom fw-bold">#{p.idProducto}</td>
              <td className="px-3 py-3 fw-bold text-start" style={{ color: tableText }}>{p.nombreProducto}</td>
              <td className="px-3 py-3 text-center" style={{ color: tableText }}>{p.categoria?.nombre || '-'}</td>
              <td className="px-3 py-3 text-center fw-semibold text-info-custom">${formatearMonto(Number(p.precioBase))}</td>
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
                  
                  <button 
                    className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => onEditar(p)}
                    title="Editar Producto"
                  >
                    <i className="bi bi-pencil-square fs-6"></i>
                  </button>

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