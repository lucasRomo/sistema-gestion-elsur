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

  // Variables cromáticas adaptativas estandarizadas
  const tableBg = isDark ? '#1d1d1d' : '#ffffff';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const theadBg = isDark ? '#1d1d1d' : '#f6f9fc';
  const theadBorder = isDark ? '#27272a' : '#e2e8f0';
  const theadText = isDark ? '#f8f8f8' : '#334155';
  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  // Ordenamos la lista por idInsumo de menor a mayor
  const insumosOrdenados = [...insumos].sort((a, b) => {
    const idA = a.idInsumo || (a as any).id || 0;
    const idB = b.idInsumo || (b as any).id || 0;
    return idA - idB;
  });

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
          <th className="py-3 px-3 text-start" style={{ width: '20%' }}>Nombre Insumo</th>
          <th className="py-3 px-3 text-center" style={{ width: '12%' }}>Precio</th>
          <th className="py-3 px-3 text-center" style={{ width: '13%' }}>Stock Empaquetado</th>
          <th className="py-3 px-3 text-center" style={{ width: '20%' }}>Stock Suelto / Consumo</th>
          <th className="py-3 px-3 text-center" style={{ width: '11%' }}>Stock Mínimo</th>
          <th className="py-3 px-3 text-start" style={{ width: '15%' }}>Proveedor</th>
          <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Estado</th>
          <th className="py-3 px-3 text-center" style={{ width: '10%' }}>Opciones</th>
        </tr>
      </thead>
      <tbody style={{ fontSize: '0.9rem' }}>
        {insumosOrdenados && insumosOrdenados.length > 0 ? (
          insumosOrdenados.map((i) => {
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
                <td className="py-3 px-3 text-center text-info fw-bold">
                  #{i.idInsumo}
                </td>
                
                {/* Nombre del Insumo */}
                <td className="py-3 px-3 fw-bold text-start" style={{ color: tableText }}>
                  {i.nombreInsumo}
                </td>

                {/* Precio */}
                <td className="py-3 px-3 text-center fw-semibold text-info">
                  ${i.precio != null ? Number(i.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </td>

                {/* Stock Empaquetado */}
                <td className="py-3 px-3 text-center">
                  {tieneEmpaque ? (
                    <span style={{ color: tableText }}>
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
                  <span className={`badge rounded-pill px-3 py-2 ${i.estado === 'Activo' ? 'bg-success bg-opacity-75' : 'bg-danger bg-opacity-75'}`} style={{ color: '#ffffff' }}>
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
                        <i className="bi bi-box-arrow-up-right fs-6"></i>
                      </button>
                    )}

                    <button 
                      className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center rounded-2" 
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onEditar(i)} 
                      title="Editar Insumo"
                    >
                      <i className="bi bi-pencil-square fs-6"></i>
                    </button>
                    
                    <button 
                      className="btn btn-sm d-flex align-items-center justify-content-center rounded-2" 
                      style={{ 
                        width: '32px', 
                        height: '32px',
                        borderColor: '#a855f7',
                        color: '#a855f7',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease-in-out'
                      }} 
                      onClick={() => onVerProveedores(i)} 
                      title="Ver Proveedores del rubro"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#a855f7';
                        e.currentTarget.style.color = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#a855f7';
                      }}
                    >
                      <i className="bi bi-truck fs-6"></i>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={9} className="text-center py-5 border-0" style={{ color: tableText }}>
              <i className="bi display-5 d-block mb-2 opacity-50"></i>
              <span className="font-monospace">No se han registrado o encontrado insumos en el sistema.</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};