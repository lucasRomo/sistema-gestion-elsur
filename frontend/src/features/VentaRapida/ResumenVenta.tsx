import React from 'react';
import type { CategoriaCliente } from '../../types/CategoriaCliente';

interface Props {
  subtotal: number;
  montoDescuento: number;
  total: number;
  categorias: CategoriaCliente[];
  categoriaSeleccionadaId: string;
  onSeleccionarCategoria: (id: string) => void;
  onCancelar: () => void;
  onCompletar: () => void;
}

export const ResumenVenta: React.FC<Props> = ({ 
  subtotal, 
  montoDescuento, 
  total, 
  categorias, 
  categoriaSeleccionadaId, 
  onSeleccionarCategoria, 
  onCancelar, 
  onCompletar 
}) => {
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
        <label className="form-label small text-light fw-bold d-flex align-items-center justify-content-between">
          <span><i className="bi bi-tags-fill text-info me-1"></i> Categoría de Cliente / Descuento:</span>
          {porcentaje > 0 && (
            <span className="badge bg-success font-monospace fs-6">
              ¡{porcentaje}% OFF APLICADO!
            </span>
          )}
        </label>
        <select 
          className="form-select bg-dark text-white border-info font-monospace"
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
      <div className="p-3 rounded mb-3" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
        <div className="d-flex justify-content-between text-light mb-1 small">
          <span>Subtotal Productos:</span>
          <span className="fw-bold">${subtotal.toFixed(2)}</span>
        </div>
        
        {porcentaje > 0 && (
          <div className="d-flex justify-content-between text-success mb-1 small">
            <span>Descuento Categoría ({porcentaje}%):</span>
            <span className="fw-bold">-${montoDescuento.toFixed(2)}</span>
          </div>
        )}

        <hr className="my-2 border-secondary" />

        <div className="d-flex justify-content-between align-items-center text-white">
          <span className="fw-bold fs-5">Total a Cobrar:</span>
          <span className="fw-bold fs-3 text-info font-monospace">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* --- BOTONES DE ACCIÓN --- */}
      <div className="d-flex justify-content-between">
        <button 
          className="btn btn-danger px-4 font-monospace" 
          style={{ backgroundColor: '#a63333', border: 'none' }}
          onClick={onCancelar}
        >
          Cancelar
        </button>
        <button 
          className="btn btn-success px-4 font-monospace fw-bold" 
          style={{ backgroundColor: '#3d824b', border: 'none' }}
          onClick={onCompletar}
        >
          Completar Venta Rápida
        </button>
      </div>
    </div>
  );
};