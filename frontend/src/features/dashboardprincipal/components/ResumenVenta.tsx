import React, { useState } from 'react';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import { useTheme } from '../../../Context/ThemeContext';

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
  onImprimirTicketCliente?: () => void;
  onImprimirTicketPago?: () => void;
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
  onImprimirTicketCliente,
  onImprimirTicketPago
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showCategoria, setShowCategoria] = useState(false);

  const catActual = categorias.find(c => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentaje = catActual 
    ? (catActual.porcentajeDescuento ?? (catActual as any).descuentoAutomatico ?? (catActual as any).descuento_automatico ?? 0) 
    : 0;

  const idPedidoActual = ultimoPedido ? (ultimoPedido.id_pedido || ultimoPedido.idPedido) : null;

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
        <div className="position-relative">
          <input
            type="text"
            readOnly
            autoComplete="off"
            className={`form-control font-monospace ${isDark ? 'bg-dark text-white border-info' : 'bg-white text-dark border-info-subtle'}`}
            style={{ cursor: 'pointer' }}
            value={
              catActual
                ? `${(catActual as any).nombre ?? (catActual as any).nombreCategoria ?? (catActual as any).nombre_categoria ?? 'Categoría'} — (${porcentaje}% Descuento)`
                : 'Sin Categoría (Consumidor Final - 0% Desc.)'
            }
            onFocus={() => setShowCategoria(true)}
            onClick={() => setShowCategoria(true)}
            onBlur={() => setTimeout(() => setShowCategoria(false), 200)}
          />
          {showCategoria && (
            <div
              className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
              style={{ maxHeight: '220px', zIndex: 1060, border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`, top: '100%', left: 0 }}
            >
              <div
                className="p-2 border-bottom text-truncate"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  backgroundColor: categoriaSeleccionadaId === '' ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                  color: categoriaSeleccionadaId === '' ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                }}
                onMouseDown={() => {
                  onSeleccionarCategoria('');
                  setShowCategoria(false);
                }}
              >
                <span className="fw-semibold">Sin Categoría (Consumidor Final - 0% Desc.)</span>
              </div>
              {categorias.map((cat: any) => {
                const id = cat.idCategoriaCliente ?? cat.idCategoria ?? cat.id_categoria ?? cat.id;
                const nombre = cat.nombre ?? cat.nombreCategoria ?? cat.nombre_categoria ?? 'Categoría';
                const porcentajeDesc = cat.porcentajeDescuento ?? cat.descuentoAutomatico ?? cat.descuento_automatico ?? cat.descuento ?? 0;
                const isSelected = id?.toString() === categoriaSeleccionadaId;

                return (
                  <div
                    key={id}
                    className="p-2 border-bottom text-truncate"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      backgroundColor: isSelected ? '#0284c7' : (isDark ? '#27272a' : '#f8fafc'),
                      color: isSelected ? '#ffffff' : (isDark ? '#e4e4e7' : '#1e293b')
                    }}
                    onMouseDown={() => {
                      onSeleccionarCategoria(id?.toString());
                      setShowCategoria(false);
                    }}
                  >
                    <span className="fw-semibold">{nombre} — ({porcentajeDesc}% Descuento)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
      <div className="d-flex justify-content-between align-items-center gap-2 w-100 flex-wrap">
        <button 
          type="button"
          className="btn font-monospace fw-bold py-2 text-center" 
          style={{ backgroundColor: '#a63333', color: '#ffffff', border: 'none', flex: '1 1 120px' }}
          onClick={onCancelar}
        >
          Cancelar
        </button>

        {/* BOTÓN TICKET CLIENTE */}
        <button 
          type="button" 
          className="btn fw-bold py-2 font-monospace d-flex align-items-center justify-content-center gap-1"
          style={{ backgroundColor: '#d8ac29', color: '#ffffff', opacity: ultimoPedido ? 1 : 0.4, flex: '1 1 140px' }}
          disabled={!ultimoPedido}
          onClick={onImprimirTicketCliente}
        >
          <i className="bi bi-printer-fill fs-6"></i>
          <span className="text-truncate">{ultimoPedido ? `T. Cliente #${idPedidoActual}` : 'T. Cliente'}</span>
        </button>

        {/* BOTÓN TICKET PAGO */}
        <button 
          type="button" 
          className="btn fw-bold py-2 font-monospace d-flex align-items-center justify-content-center gap-1"
          style={{ backgroundColor: '#27ace6', color: '#ffffff', opacity: ultimoPedido ? 1 : 0.4, flex: '1 1 140px' }}
          disabled={!ultimoPedido}
          onClick={onImprimirTicketPago}
        >
          <i className="bi bi-receipt fs-6"></i>
          <span className="text-truncate">{ultimoPedido ? `T. Pago #${idPedidoActual}` : 'T. Pago'}</span>
        </button>

        <button 
          type="button"
          className="btn font-monospace fw-bold py-2 text-center" 
          style={{ backgroundColor: '#3d824b', color: '#ffffff', border: 'none', flex: '1 1 150px' }}
          onClick={onCompletar}
        >
          Elegir Metodo de Pago
        </button>
      </div>
    </div>
  );
};
