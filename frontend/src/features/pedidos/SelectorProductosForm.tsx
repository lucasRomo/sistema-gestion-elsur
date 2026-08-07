import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';
import type { CartItem } from '../../types/Pedido';
import type { CategoriaCliente } from '../../types/CategoriaCliente';
import type { Maquina } from '../../types/Maquina';
import { useTheme } from '../../Context/ThemeContext';

interface Props {
  productos: Producto[];
  carrito: CartItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CartItem[]>>;
  categorias: CategoriaCliente[];
  categoriaSeleccionadaId: string;
  setCategoriaSeleccionadaId: (id: string) => void;
  maquinas?: Maquina[];
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
  maquinas = [],
  onSiguiente, 
  onCancelar 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const containerBg = isDark ? '#18181b' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const borderTheme = isDark ? '#3f3f46' : '#cbd5e1';
  const cardSectionBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');

  // Modal para máquinas fuera de servicio
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

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

  const handleContinuarSiguiente = () => {
    const conflictos: { productoNombre: string; maquinaNombre: string; estado: string }[] = [];

    carrito.forEach(item => {
      const prod = item.producto as any;
      if (!prod) return;

      const maquinaAsociada = prod.maquinaNecesaria || prod.maquina || prod.maquinaAsociada;
      const maquinaId = maquinaAsociada?.idMaquina ?? maquinaAsociada?.id ?? prod.idMaquina;

      let maquinaObj: any = undefined;
      if (maquinaId !== undefined && maquinaId !== null && maquinas.length > 0) {
        maquinaObj = maquinas.find(m => String(m.idMaquina) === String(maquinaId));
      }

      if (!maquinaObj) {
        maquinaObj = maquinaAsociada;
      }

      if (!maquinaObj) return;

      const nombreMaquina = (maquinaObj.nombre || maquinaObj.nombreMaquina || '').trim();
      const estadoRaw = (maquinaObj.estado || '').trim().toUpperCase();
      const estadoNormalizado = estadoRaw.replace(/_/g, ' ');

      if (!nombreMaquina || nombreMaquina.toLowerCase().includes('no aplica')) {
        return;
      }

      if (
        estadoNormalizado.includes('FUERA DE SERVICIO') || 
        estadoNormalizado.includes('FALLA') || 
        estadoNormalizado.includes('MANTENIMIENTO')
      ) {
        conflictos.push({
          productoNombre: prod.nombreProducto || prod.nombre || 'Producto sin nombre',
          maquinaNombre: nombreMaquina,
          estado: estadoRaw
        });
      }
    });

    if (conflictos.length > 0) {
      setConflictosMaquinas(conflictos);
      setShowModalMaquinas(true);
    } else {
      onSiguiente();
    }
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
    <div className="w-100 font-monospace">
      <div 
        className="card p-4 w-100 rounded shadow-sm" 
        style={{ 
          maxWidth: '1570px', 
          backgroundColor: containerBg, 
          color: textPrimary, 
          border: `1px solid ${borderTheme}` 
        }}
      >
        <h2 className="text-center mb-4 fw-bold" style={{ color: isDark ? '#0bc9f8' : 'inherit' }}>
          Tabla para Calcular y Elegir Productos
        </h2>
        
        {/* Selector de Producto y Cantidad */}
        <div className="row g-3 mb-4 align-items-end">
          <div className="col-md-7">
            <label className="form-label small fw-bold" style={{ color: mutedText }}>Producto:</label>
            <select 
              className={`form-select ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
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
            <label className="form-label small fw-bold" style={{ color: mutedText }}>Cantidad:</label>
            <input 
              type="number" 
              className={`form-control ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <button 
              className="btn w-100 fw-bold text-white" 
              style={{ backgroundColor: '#0284c7' }} 
              onClick={handleAgregar}
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de Productos Agregados */}
        <div className="mb-4">
          <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted" style={{ borderColor: borderTheme }}>
            <div style={{ width: '40%' }}>Lista de Productos:</div>
            <div style={{ width: '20%' }}>Cantidad:</div>
            <div style={{ width: '20%' }}>Precio Unitario:</div>
            <div style={{ width: '20%' }}>SubTotal:</div>
          </div>
          
          <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}>
            {carrito.length === 0 ? (
              <div className="text-center my-4 py-2" style={{ color: mutedText }}>No hay productos en la lista.</div>
            ) : (
              carrito.map((item, index) => (
                <div 
                  key={index} 
                  className="d-flex align-items-center mb-2 border-bottom pb-2" 
                  style={{ borderColor: isDark ? '#2d2d30' : '#e2e8f0' }}
                >
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
                  <div style={{ width: '20%' }}>{item.cantidad}</div>
                  <div style={{ width: '20%' }}>${item.producto.precioBase}</div>
                  <div style={{ width: '20%' }} className="fw-bold text-info">${item.subtotal.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categoría de Cliente */}
        <div className="mb-4">
          <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
            <span><i className="bi bi-tags-fill me-1 text-info"></i> Categoría de Cliente / Descuento:</span>
            {porcentajeDescuento > 0 && (
              <span className="badge bg-success font-monospace fs-6">
                ¡{porcentajeDescuento}% OFF APLICADO!
              </span>
            )}
          </label>
          <select 
            className={`form-select ${isDark ? 'bg-dark text-white border-info' : ''}`}
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

        {/* Resumen Total */}
        <div className="p-3 rounded mb-4" style={{ backgroundColor: cardSectionBg, border: `1px solid ${borderTheme}` }}>
          <div className="d-flex justify-content-between mb-1 small">
            <span>Subtotal Productos:</span>
            <span className="fw-bold">${subtotal.toFixed(2)}</span>
          </div>

          {porcentajeDescuento > 0 && (
            <div className="d-flex justify-content-between text-success mb-1 small">
              <span>Descuento Aplicado ({porcentajeDescuento}%):</span>
              <span className="fw-bold">-${montoDescuento.toFixed(2)}</span>
            </div>
          )}

          <hr className="my-2" style={{ borderColor: borderTheme }} />

          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-5">Total a Cobrar:</span>
            <span className="fw-bold fs-3 text-info font-monospace">${totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-danger px-4" onClick={onCancelar}>
            Volver
          </button>
          <button 
            className="btn btn-success px-5 fw-bold" 
            onClick={handleContinuarSiguiente} 
            disabled={carrito.length === 0}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Impacto Estimado en Stock */}
      <div 
        className="card p-4 w-100 rounded mt-4 shadow-sm" 
        style={{ 
          maxWidth: '1570px', 
          backgroundColor: containerBg, 
          color: textPrimary, 
          border: `1px solid ${borderTheme}` 
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-boxes text-info"></i>
          <span className="small fw-bold">Impacto Estimado en el Stock de Insumos:</span>
        </div>

        <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted" style={{ borderColor: borderTheme }}>
          <div style={{ width: '40%' }}>Insumo Afectado:</div>
          <div style={{ width: '20%' }}>Cantidad Requerida:</div>
          <div style={{ width: '20%' }}>Stock Actual:</div>
          <div style={{ width: '20%' }}>Stock Resultante:</div>
        </div>

        <div style={{ minHeight: '60px', maxHeight: '160px', overflowY: 'auto' }}>
          {carrito.length === 0 ? (
            <div className="text-center mt-3 small" style={{ color: mutedText }}>
              Agregue productos arriba para ver el impacto en el stock de insumos.
            </div>
          ) : (
            carrito.map((item, index) => (
              <div 
                key={index} 
                className="d-flex align-items-center mb-2 border-bottom pb-1 small" 
                style={{ borderColor: isDark ? '#2d2d30' : '#e2e8f0' }}
              >
                <div style={{ width: '40%' }}>{item.producto.nombreProducto}</div>
                <div style={{ width: '20%' }}>{item.cantidad} unidad(es)</div>
                <div style={{ width: '20%' }}>${item.producto.precioBase.toFixed(2)}</div>
                <div style={{ width: '20%' }} className="fw-bold">${item.subtotal.toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE ADVERTENCIA POR MÁQUINAS FUERA DE SERVICIO */}
      {showModalMaquinas && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white" 
              style={{ border: '2px solid #ffc107', backgroundColor: '#18181b', borderRadius: '12px' }}
            >
              <div className="text-center mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-1 text-warning"></i>
                <h5 className="fw-bold mt-2 text-warning">¡Atención! Maquinaria Fuera de Servicio</h5>
              </div>
              
              <p className="small text-light">
                Los siguientes productos seleccionados requieren maquinaria que actualmente no está operativa:
              </p>

              <div className="list-group mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {conflictosMaquinas.map((conf, idx) => (
                  <div key={idx} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{conf.productoNombre}</div>
                      <small className="text-secondary">Equipo: {conf.maquinaNombre}</small>
                    </div>
                    <span className="badge bg-danger">{conf.estado}</span>
                  </div>
                ))}
              </div>

              <p className="small text-secondary mb-4 text-center">
                ¿Desea continuar con el pedido de todas formas o cancelar para modificar el carrito?
              </p>

              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-sm btn-danger px-3" 
                  onClick={() => setShowModalMaquinas(false)}
                >
                  Cancelar / Volver
                </button>
                <button 
                  className="btn btn-sm btn-warning px-3 fw-bold text-dark" 
                  onClick={() => {
                    setShowModalMaquinas(false);
                    onSiguiente();
                  }}
                >
                  Continuar de todos modos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};