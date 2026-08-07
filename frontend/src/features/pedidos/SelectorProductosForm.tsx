import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';
import type { CartItem } from '../../types/Pedido';
import type { CategoriaCliente } from '../../types/CategoriaCliente';

interface Props {
  productos: Producto[];
  carrito: CartItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CartItem[]>>;
  categorias: CategoriaCliente[];
  categoriaSeleccionadaId: string;
  setCategoriaSeleccionadaId: (id: string) => void;
  onSiguiente: () => void;
  onCancelar: () => void;
}

export const SelectorProductosForm: React.FC<Props> = ({ 
  productos, 
  carrito, 
  setCarrito, 
  categorias,
  categoriaSeleccionadaId,
  setCategoriaSeleccionadaId,
  onSiguiente, 
  onCancelar 
}) => {
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');

  const handleAgregar = () => {
    if (!productoId || Number(cantidad) <= 0) return;
    
    const prodSeleccionado = productos.find(p => p.idProducto === Number(productoId));
    if (!prodSeleccionado) return;

    const nuevoItem: CartItem = {
      producto: prodSeleccionado,
      cantidad: Number(cantidad),
      subtotal: prodSeleccionado.precioBase * Number(cantidad)
    };

    setCarrito([...carrito, nuevoItem]);
    setProductoId('');
    setCantidad('1');
  };

  const handleEliminar = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const subtotal = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  const catActual = categorias.find(c => {
    const id = c.idCategoriaCliente ?? (c as any).idCategoria ?? (c as any).id_categoria ?? (c as any).id;
    return id?.toString() === categoriaSeleccionadaId;
  });

  const porcentajeDescuento = catActual 
    ? Number(catActual.porcentajeDescuento ?? (catActual as any).descuentoAutomatico ?? (catActual as any).descuento_automatico ?? 0) 
    : 0;

  const montoDescuento = (subtotal * porcentajeDescuento) / 100;
  const totalFinal = subtotal - montoDescuento;

  return (
    <div className="w-100">
      <div className="card im-surface p-4 w-100 rounded shadow-sm" style={{ maxWidth: '1570px' }}>
        <h2 className="text-center mb-4 fw-bold">Tabla para Calcular y Elegir Productos</h2>
        
        {/* Selector de Producto y Cantidad */}
        <div className="row g-3 mb-4 align-items-end">
          <div className="col-md-7">
            <label className="form-label small fw-bold">Producto:</label>
            <select 
              className="form-select"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
            >
              <option value="">Seleccione un producto...</option>
              {productos.map(p => (
                <option key={p.idProducto} value={p.idProducto}>
                  {p.nombreProducto} - ${p.precioBase}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-2">
            <label className="form-label small fw-bold">Cantidad:</label>
            <input 
              type="number" 
              className="form-control"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button className="btn btn-primary w-100 fw-bold" onClick={handleAgregar}>
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de Productos Agregados */}
        <div className="mb-4">
          <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted">
            <div style={{ width: '40%' }}>Lista de Productos:</div>
            <div style={{ width: '20%' }}>Cantidad:</div>
            <div style={{ width: '20%' }}>Precio Unitario:</div>
            <div style={{ width: '20%' }}>SubTotal:</div>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {carrito.length === 0 ? (
              <div className="text-center text-muted my-4 py-2">No hay productos en la lista.</div>
            ) : (
              carrito.map((item, index) => (
                <div key={index} className="d-flex align-items-center mb-2 border-bottom pb-2">
                  <div style={{ width: '40%' }} className="d-flex align-items-center gap-2">
                    <button 
                      type="button" 
                      className="btn btn-sm text-danger p-0 border-0 bg-transparent" 
                      onClick={() => handleEliminar(index)}
                      title="Quitar de la lista"
                    >
                      <i className="bi bi-x-circle-fill fs-6"></i>
                    </button>
                    <span>{item.producto.nombreProducto}</span>
                  </div>
                  <div style={{ width: '20%' }} className="font-monospace">{item.cantidad}</div>
                  <div style={{ width: '20%' }} className="font-monospace">${item.producto.precioBase}</div>
                  <div style={{ width: '20%' }} className="fw-bold font-monospace">${item.subtotal.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categoría de Cliente */}
        <div className="mb-4">
          <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
            <span><i className="bi bi-tags-fill me-1"></i> Categoría de Cliente / Descuento:</span>
            {porcentajeDescuento > 0 && (
              <span className="badge bg-success font-monospace fs-6">
                ¡{porcentajeDescuento}% OFF APLICADO!
              </span>
            )}
          </label>
          <select 
            className="form-select font-monospace"
            value={categoriaSeleccionadaId}
            onChange={(e) => setCategoriaSeleccionadaId(e.target.value)}
          >
            <option value="">Sin Categoría (Consumidor Final - 0% Desc.)</option>
            {categorias.map((cat: any) => {
              const id = cat.idCategoriaCliente ?? cat.idCategoria ?? cat.id_categoria ?? cat.id;
              const nombre = cat.nombreCategoria ?? cat.nombre ?? cat.nombre_categoria ?? 'Categoría';
              const porcentajeDesc = cat.porcentajeDescuento ?? cat.descuentoAutomatico ?? cat.descuento_automatico ?? 0;

              return (
                <option key={id} value={id}>
                  {nombre} — ({porcentajeDesc}% Descuento)
                </option>
              );
            })}
          </select>
        </div>

        {/* Resumen Total Estilo Dashboard */}
        <div className="summary-card-custom p-3 rounded mb-4">
          <div className="d-flex justify-content-between mb-1 small">
            <span>Subtotal Productos:</span>
            <span className="fw-bold font-monospace">${subtotal.toFixed(2)}</span>
          </div>

          {porcentajeDescuento > 0 && (
            <div className="d-flex justify-content-between text-success mb-1 small">
              <span>Descuento Aplicado ({porcentajeDescuento}%):</span>
              <span className="fw-bold font-monospace">-${montoDescuento.toFixed(2)}</span>
            </div>
          )}

          <hr className="my-2" />

          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-5">Total a Cobrar:</span>
            <span className="fw-bold fs-3 text-primary font-monospace">${totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-danger px-4" onClick={onCancelar}>
            Volver
          </button>
          <button className="btn btn-success px-5 fw-bold" onClick={onSiguiente} disabled={carrito.length === 0}>
            Siguiente
          </button>
        </div>
      </div>

      {/* Impacto Estimado en Stock */}
<div 
  className="card im-surface p-4 w-100 rounded mt-4" 
  style={{ maxWidth: '1570px' }}
>
  <div className="d-flex align-items-center gap-2 mb-3">
    <i className="bi bi-boxes"></i>
    <span className="small fw-bold">Impacto Estimado en el Stock de Insumos:</span>
  </div>

  <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted">
    <div style={{ width: '40%' }}>Insumo Afectado:</div>
    <div style={{ width: '20%' }}>Cantidad Requerida:</div>
    <div style={{ width: '20%' }}>Stock Actual:</div>
    <div style={{ width: '20%' }}>Stock Resultante:</div>
  </div>

  <div style={{ minHeight: '60px', maxHeight: '160px', overflowY: 'auto' }}>
    {carrito.length === 0 ? (
      <div className="text-center text-muted mt-3 small">
        Agregue productos arriba para ver el impacto en el stock de insumos.
      </div>
    ) : (
      carrito.map((item, index) => (
        <div key={index} className="d-flex align-items-center mb-2 border-bottom pb-1 small">
          <div style={{ width: '40%' }}>{item.producto.nombreProducto}</div>
          <div style={{ width: '20%' }} className="font-monospace">{item.cantidad} unidad(es)</div>
          <div style={{ width: '20%' }} className="font-monospace">${item.producto.precioBase.toFixed(2)}</div>
          <div style={{ width: '20%' }} className="fw-bold font-monospace">${item.subtotal.toFixed(2)}</div>
        </div>
      ))
    )}
  </div>
</div>
    </div>
  );
};