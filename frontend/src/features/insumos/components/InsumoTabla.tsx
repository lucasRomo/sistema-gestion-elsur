import React from 'react';
import type { Insumo } from '../types/Insumo';
import { useTheme } from '../../../Context/ThemeContext';

interface InsumoTablaProps {
  insumos: Insumo[];
  onEditar: (insumo: Insumo) => void;
  onVerProveedores: (insumo: Insumo) => void;
  onConvertir?: (insumo: Insumo) => void;
}

export const InsumoTabla: React.FC<InsumoTablaProps> = ({ insumos, onEditar, onVerProveedores, onConvertir }) => {
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
        height: '67vh'
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
              <th className="py-3 px-3 text-start">Nombre Insumo</th>
              <th className="py-3 px-3 text-center">Precio ($)</th>
              <th className="py-3 px-3 text-center">Stock Empaquetado</th>
              <th className="py-3 px-3 text-center">Stock Suelto / Consumo</th>
              <th className="py-3 px-3 text-center">Stock Mínimo</th>
              <th className="py-3 px-3 text-start">Proveedor</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-center">Opciones</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.9rem' }}>
            {insumos.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5" style={{ color: '#ffffff' }}>
  No se han registrado o encontrado insumos en el sistema.
</td>
              </tr>
            ) : (
              insumos.map((i) => {
                const tieneBajoStock = i.stockActual <= i.stockMinimo;
                const tieneEmpaque = Boolean(i.factorConversion && i.factorConversion > 0);
                const uniSueltas = i.unidadMedida?.nombre || 'unid.';
                const uniEmpaque = i.unidadCompra?.nombre || 'bultos';

                return (
                  <tr 
                    key={i.idInsumo}
                    style={{ borderBottom: `1px solid ${rowBorder}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* ID */}
                    <td className="py-3 px-3 fw-bold text-center text-info">
                      #{i.idInsumo}
                    </td>
                    
                    {/* Nombre del Insumo */}
                    <td className="py-3 px-3 fw-bold text-start">
                      {i.nombreInsumo}
                    </td>

                    {/* Precio */}
                    <td className="py-3 px-3 text-center fw-bold text-info">
                      ${i.precio != null ? Number(i.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </td>

                    {/* Stock Empaquetado */}
                    <td className="py-3 px-3 text-center">
                      {tieneEmpaque ? (
                        <span className="border-secondary text-light">
                          {i.stockEmpaquetado ?? 0} {uniEmpaque}
                        </span>
                      ) : (
                        <span className="small" style={{ color: mutedText }}>N/A</span>
                      )}
                    </td>

                    {/* Stock Suelto / Consumo */}
                    <td className={`py-3 px-3 text-center fw-bold ${tieneBajoStock ? 'text-danger' : 'text-success'}`}>
                      {i.stockActual} {uniSueltas} {tieneBajoStock && <i className="bi bi-exclamation-circle-fill text-danger ms-1" title="Stock por debajo del mínimo"></i>}
                    </td>

                    {/* Stock Mínimo */}
                    <td className="py-3 px-3 text-center text-warning fw-bold">
                      {i.stockMinimo} {uniSueltas}
                    </td>

                    {/* Proveedor */}
                    <td className="py-3 px-3 text-start" style={{ color: isDark ? '#e4e4e7' : '#334155' }}>
                      {i.proveedor?.nombreComercial || i.proveedor?.tipoProveedor?.descripcion || '-'}
                    </td>
                    
                    {/* Estado */}
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
                    
                    {/* Opciones / Acciones */}
                    <td className="py-3 px-3 text-center">
                      <div className="d-flex justify-content-center gap-2">
                        {tieneEmpaque && onConvertir && (
                          <button 
                            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center rounded-2" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => onConvertir(i)} 
                            title="Abrir / Convertir Bulto"
                          >
                            <i className="bi bi-box-arrow-up-right"></i>
                          </button>
                        )}

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
    </div>
  );
};