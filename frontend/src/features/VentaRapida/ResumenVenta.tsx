import React from 'react';
import type { CategoriaCliente } from '../../types/CategoriaCliente';
import { useTheme } from '../../Context/ThemeContext';

interface Props {
  subtotal: number;
  montoDescuento: number;
  total: number;
  categorias: CategoriaCliente[];
  categoriaSeleccionadaId: string;
  onSeleccionarCategoria: (id: string) => void;
  onCancelar: () => void;
  onCompletar: () => void;
  ultimoPedido?: any;
  onImprimirTicket?: () => void;
}

export const ResumenVenta: React.FC<Props> = ({ 
  subtotal, 
  montoDescuento, 
  total, 
  categorias, 
  categoriaSeleccionadaId, 
  onSeleccionarCategoria, 
  onCancelar, 
  onCompletar,
  ultimoPedido,
  onImprimirTicket
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const catActual = categorias.find(c => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentaje = catActual 
    ? (catActual.porcentajeDescuento ?? (catActual as any).descuentoAutomatico ?? (catActual as any).descuento_automatico ?? 0) 
    : 0;

  return (
    <div className="mt-3">
      {/* --- SELECTOR DE CATEGORÍA DE CLIENTE --- */}
      <div className="mb-3">
        <label className={`form-label small fw-bold d-flex align-items-center justify-content-between ${isDark ? 'text-light' : 'text-dark'}`}>
          <span><i className="bi bi-tags-fill text-info me-1"></i> Categoría de Cliente / Descuento:</span>
          {porcentaje > 0 && (
            <span className="badge bg-success font-monospace fs-6">
              ¡{porcentaje}% OFF APLICADO!
            </span>
          )}
        </label>
        <select 
          className={`form-select font-monospace ${isDark ? 'bg-dark text-white border-info' : 'bg-white text-dark border-info-subtle'}`}
          value={categoriaSeleccionadaId}
          onChange={(e) => onSeleccionarCategoria(e.target.value)}
        >
          <option value="">Sin Categoría (Consumidor Final - 0% Desc.)</option>
          {categorias.map((cat: any) => {
            const id = cat.idCategoriaCliente ?? cat.idCategoria ?? cat.id_categoria ?? cat.id;
            const nombre = cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Categoría';
            const porcentajeDesc = cat.porcentajeDescuento ?? cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.descuento ?? 0;

            return (
              <option key={id} value={id}>
                {nombre} — ({porcentajeDesc}% Descuento)
              </option>
            );
          })}
        </select>
      </div>

      {/* --- DESGLOSE VISUAL DE PRECIOS --- */}
      <div 
  className="p-3 rounded mb-3" 
  style={{ 
    backgroundColor: isDark ? '#18181b' : '#f1f5f9', 
    border: isDark ? '1px solid #3f3f46' : '1px solid #e2e8f0' 
  }}
>
        <div className={`d-flex justify-content-between mb-1 small ${isDark ? 'text-light' : 'text-secondary'}`}>
    <span>Subtotal Productos:</span>
    <span className={`fw-bold ${isDark ? 'text-white' : 'text-dark'}`}>${subtotal.toFixed(2)}</span>
  </div>
        
        {porcentaje > 0 && (
          <div className="d-flex justify-content-between text-success mb-1 small">
            <span>Descuento Categoría ({porcentaje}%):</span>
            <span className="fw-bold">-${montoDescuento.toFixed(2)}</span>
          </div>
        )}

        <hr className={`my-2 ${isDark ? 'border-secondary' : 'border-secondary-subtle'}`} />

        <div className="d-flex justify-content-between align-items-center">
    <span className={`fw-bold fs-5 ${isDark ? 'text-white' : 'text-dark'}`}>Total a Cobrar:</span>
    <span className={`fw-bold fs-3 font-monospace ${isDark ? 'text-info' : 'text-primary'}`}>
      ${total.toFixed(2)}
    </span>
  </div>
</div>

      {/* --- BOTONES DE ACCIÓN --- */}
      <div className="d-flex justify-content-between align-items-center gap-3 w-100">
        <button 
          type="button"
          className="btn btn-danger font-monospace py-2 text-center" 
          style={{ backgroundColor: '#a63333', border: 'none', flex: 1 }}
          onClick={onCancelar}
        >
          Cancelar
        </button>

        <button 
          type="button" 
          className="btn fw-bold py-2 text-dark font-monospace d-flex align-items-center justify-content-center gap-2"
          style={{ 
            backgroundColor: '#eab308', 
            border: 'none', 
            borderRadius: '6px',
            opacity: ultimoPedido ? 1 : 0.4,
            cursor: ultimoPedido ? 'pointer' : 'not-allowed',
            flex: 1
          }}
          disabled={!ultimoPedido}
          onClick={onImprimirTicket}
        >
          <i className="bi bi-printer-fill fs-6"></i>
          <span className="text-truncate">
            {ultimoPedido ? `Imprimir Ticket #${ultimoPedido.id_pedido}` : 'Imprimir Ticket'}
          </span>
        </button>

        <button 
          type="button"
          className="btn btn-success font-monospace fw-bold py-2 text-center" 
          style={{ backgroundColor: '#3d824b', border: 'none', flex: 1 }}
          onClick={onCompletar}
        >
          Completar Venta Rápida
        </button>
      </div>
    </div>
  );
};