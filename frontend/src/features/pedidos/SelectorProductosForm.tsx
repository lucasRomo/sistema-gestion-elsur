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

  // CÁLCULOS DE DESCUENTO
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
      {/* TARJETA PRINCIPAL */}
      <div className="card text-white p-4 w-100 rounded mb-4" style={{ backgroundColor: '#1E1E1F', border: '1px solid #3f3f46' }}>
        <h2 className="text-center mb-4 fw-bold">Tabla para Calcular y Elegir Productos</h2>
        
        {/* SELECTOR DE PRODUCTOS */}
        <div className="row g-3 mb-4 align-items-end">
          <div className="col-md-7">
            <label className="form-label small text-secondary fw-bold">Producto:</label>
            <select 
              className="form-select bg-dark text-white border-secondary"
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
            <label className="form-label small text-secondary fw-bold">Cantidad:</label>
            <input 
              type="number" 
              className="form-control bg-dark text-white border-secondary"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button className="btn w-100 fw-bold text-white" style={{ backgroundColor: '#5a8ab8' }} onClick={handleAgregar}>
              Agregar
            </button>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS EN CARRITO (Scroll vertical a partir de 3 productos) */}
        <div className="mb-4">
          <div className="d-flex text-secondary border-bottom border-secondary pb-2 mb-2 small fw-bold">
            <div style={{ width: '40%' }}>Lista de Productos:</div>
            <div style={{ width: '20%' }}>Cantidad:</div>
            <div style={{ width: '20%' }}>Precio Unitario:</div>
            <div style={{ width: '20%' }}>SubTotal:</div>
          </div>
          
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {carrito.length === 0 ? (
              <div className="text-center text-light mt-4">No hay productos en la lista.</div>
            ) : (
              carrito.map((item, index) => (
                <div key={index} className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1">
                  <div style={{ width: '40%' }} className="d-flex align-items-center">
                    <button className="btn btn-sm text-danger p-0 me-2" onClick={() => handleEliminar(index)}>
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                    <span>{item.producto.nombreProducto}</span>
                  </div>
                  <div style={{ width: '20%' }}>{item.cantidad}</div>
                  <div style={{ width: '20%' }}>${item.producto.precioBase}</div>
                  <div style={{ width: '20%' }} className="fw-bold text-info">${item.subtotal.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SELECTOR DE CATEGORÍA DE CLIENTE / DESCUENTO */}
        <div className="mb-4">
          <label className="form-label small text-light fw-bold d-flex align-items-center justify-content-between">
            <span><i className="bi bi-tags-fill text-info me-1"></i> Categoría de Cliente / Descuento:</span>
            {porcentajeDescuento > 0 && (
              <span className="badge bg-success font-monospace fs-6">
                ¡{porcentajeDescuento}% OFF APLICADO!
              </span>
            )}
          </label>
          <select 
            className="form-select bg-dark text-white border-info font-monospace"
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

        {/* DESGLOSE VISUAL Y TOTAL FINAL */}
        <div className="p-3 rounded mb-4" style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}>
          <div className="d-flex justify-content-between text-light mb-1 small">
            <span>Subtotal Productos:</span>
            <span className="fw-bold">${subtotal.toFixed(2)}</span>
          </div>

          {porcentajeDescuento > 0 && (
            <div className="d-flex justify-content-between text-success mb-1 small">
              <span>Descuento Aplicado ({porcentajeDescuento}%):</span>
              <span className="fw-bold">-${montoDescuento.toFixed(2)}</span>
            </div>
          )}

          <hr className="my-2 border-secondary" />

          <div className="d-flex justify-content-between align-items-center text-white">
            <span className="fw-bold fs-5">Precio Total Final:</span>
            <span className="fw-bold fs-3 text-info font-monospace">${totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-danger px-4" style={{ backgroundColor: '#a63333', border: 'none' }} onClick={onCancelar}>
            Volver
          </button>
          <div>
            <button className="btn btn-success px-5" style={{ backgroundColor: '#3d824b', border: 'none' }} onClick={onSiguiente} disabled={carrito.length === 0}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: FUERA DE LA TARJETA PRINCIPAL */}
      <div className="p-3 rounded mb-4 text-white" style={{ backgroundColor: '#1E1E1F', border: '1px solid #3f3f46' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-boxes text-info"></i>
          <span className="small text-secondary fw-bold">Impacto Estimado en el Stock de Insumos:</span>
        </div>

        <div className="d-flex text-secondary border-bottom border-secondary pb-2 mb-2 small fw-bold">
          <div style={{ width: '40%' }}>Insumo Afectado:</div>
          <div style={{ width: '20%' }}>Cantidad Requerida:</div>
          <div style={{ width: '20%' }}>Stock Actual:</div>
          <div style={{ width: '20%' }}>Stock Resultante:</div>
        </div>

        <div style={{ minHeight: '80px', maxHeight: '160px', overflowY: 'auto' }}>
          {carrito.length === 0 ? (
            <div className="text-center text-light mt-3 small">Agregue productos arriba para ver el impacto en el stock de insumos.</div>
          ) : (
            <>
              <div className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1 small">
                <div style={{ width: '40%' }}>Hojas A4 (Resma)</div>
                <div style={{ width: '20%' }} className="text-warning">2 unidades</div>
                <div style={{ width: '20%' }} className="text-light">45 unidades</div>
                <div style={{ width: '20%' }} className="fw-bold text-success">43 unidades</div>
              </div>
              <div className="d-flex align-items-center mb-2 text-white border-bottom border-dark pb-1 small">
                <div style={{ width: '40%' }}>Anillos metálicos 12mm</div>
                <div style={{ width: '20%' }} className="text-warning">1 unidad</div>
                <div style={{ width: '20%' }} className="text-light">120 unidades</div>
                <div style={{ width: '20%' }} className="fw-bold text-success">119 unidades</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};