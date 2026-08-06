import React, { useState } from 'react';
import type { Producto } from '../../types/Producto';
import type { CartItem } from '../../types/Pedido';
import type { CategoriaCliente } from '../../types/CategoriaCliente';
import type { Maquina } from '../../types/Maquina';

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
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');

  // Estado para el modal de advertencia de máquinas fuera de servicio
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

  // VALIDACIÓN DE MÁQUINAS EN ESTADO "FUERA DE SERVICIO" O "FALLA" ADAPTADA AL BACKEND
  const handleContinuarSiguiente = () => {
    const conflictos: { productoNombre: string; maquinaNombre: string; estado: string }[] = [];

    carrito.forEach(item => {
      const prod = item.producto as any;
      if (!prod) return;

      // 1. Obtener la máquina asignada desde 'maquinaNecesaria' (Spring Boot) o fallbacks
      const maquinaAsociada = prod.maquinaNecesaria || prod.maquina || prod.maquinaAsociada;
      
      // 2. Extraer el ID de la máquina
      const maquinaId = maquinaAsociada?.idMaquina ?? maquinaAsociada?.id ?? prod.idMaquina;

      // 3. Buscar en la lista global 'maquinas' para obtener el estado en tiempo real (conversión String para evitar fallos de tipo)
      let maquinaObj: any = undefined;
      if (maquinaId !== undefined && maquinaId !== null && maquinas.length > 0) {
        maquinaObj = maquinas.find(m => String(m.idMaquina) === String(maquinaId));
      }

      // Fallback al objeto anidado si no está en la lista global
      if (!maquinaObj) {
        maquinaObj = maquinaAsociada;
      }

      if (!maquinaObj) return;

      const nombreMaquina = (maquinaObj.nombre || maquinaObj.nombreMaquina || '').trim();
      
      // Normalizar Enum de Java (ej. "FUERA_DE_SERVICIO" a "FUERA DE SERVICIO")
      const estadoRaw = (maquinaObj.estado || '').trim().toUpperCase();
      const estadoNormalizado = estadoRaw.replace(/_/g, ' ');

      // OMITIR SI "NO APLICA" O SI NO TIENE NOMBRE
      if (!nombreMaquina || nombreMaquina.toLowerCase().includes('no aplica')) {
        return;
      }

      // EVALUAR ESTADOS NO OPERATIVOS
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
    <>
      <div className="card text-white p-4 w-100 rounded" style={{ backgroundColor: '#1E1E1F', border: '1px solid #3f3f46' }}>
        <h3 className="text-center mb-4 fw-normal font-monospace">Tabla para Calcular y Elegir Productos</h3>
        
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

        {/* TABLA DE PRODUCTOS EN CARRITO */}
        <div className="mb-4">
          <div className="d-flex text-secondary border-bottom border-secondary pb-2 mb-2 small fw-bold">
            <div style={{ width: '40%' }}>Lista de Productos:</div>
            <div style={{ width: '20%' }}>Cantidad:</div>
            <div style={{ width: '20%' }}>Precio Unitario:</div>
            <div style={{ width: '20%' }}>SubTotal:</div>
          </div>
          
          <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}>
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
            <button 
              className="btn btn-success px-5" 
              style={{ backgroundColor: '#3d824b', border: 'none' }} 
              onClick={handleContinuarSiguiente} 
              disabled={carrito.length === 0}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ADVERTENCIA POR MÁQUINAS FUERA DE SERVICIO */}
      {showModalMaquinas && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white" 
              style={{ border: '2px solid #ffc107', backgroundColor: '#1a1a1c', borderRadius: '12px', fontFamily: 'monospace' }}
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
                  className="btn btn-sm px-3 text-white" 
                  style={{ backgroundColor: '#e22e2e', border: '1px solid #e22e2e', borderRadius: '6px' }}
                  onClick={() => setShowModalMaquinas(false)}
                >
                  Cancelar / Volver
                </button>
                <button 
                  className="btn btn-sm px-3 text-dark font-weight-bold" 
                  style={{ backgroundColor: '#ffc107', border: '1px solid #ffc107', borderRadius: '6px', fontWeight: 'bold' }}
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
    </>
  );
};