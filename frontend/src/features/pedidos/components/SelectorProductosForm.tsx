import React, { useState, useMemo } from 'react';
import type { Producto } from '../../productos/types/Producto';
import type { CartItem } from '../types/Pedido';
import type { CategoriaCliente } from '../../clientes/types/CategoriaCliente';
import type { Maquina } from '../../maquinas/types/Maquina';
import { useTheme } from '../../../Context/ThemeContext';

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

  const containerBg = isDark ? '#1b1b1b' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const borderTheme = isDark ? '#3f3f46' : '#cbd5e1';
  const cardSectionBg = isDark ? '#27272a' : '#f8fafc';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';

  const [productoId, setProductoId] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [cantidad, setCantidad] = useState('1');

  // Modal para máquinas fuera de servicio
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

  // Filtrado reactivo de productos según lo que escriba el usuario
  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return productos;
    return productos.filter(p => 
      p.nombreProducto.toLowerCase().includes(busquedaProducto.toLowerCase())
    );
  }, [productos, busquedaProducto]);

  const handleAgregar = async () => {
  if (!productoId || Number(cantidad) <= 0) return;
  const prodSeleccionado = productos.find(p => p.idProducto === Number(productoId));
  if (!prodSeleccionado) return;
  let recetaInsumos: any[] = [];
  try {
    const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${prodSeleccionado.idProducto}`);
    if (res.ok) {
      recetaInsumos = await res.json();
    }
  } catch (error) {
    console.error("Error al obtener la receta del producto:", error);
  }
  const nuevoItem: CartItem & { receta?: any[] } = {
    producto: {
      ...prodSeleccionado,
      receta: recetaInsumos 
    },
    cantidad: Number(cantidad),
    subtotal: prodSeleccionado.precioBase * Number(cantidad)
  };

  setCarrito([...carrito, nuevoItem]);
  setProductoId('');
  setBusquedaProducto('');
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

  // Agrupa y calcula el consumo total de insumos según los productos del carrito con sanitización defensiva
  const insumosAfectados = React.useMemo(() => {
  const mapaInsumos = new Map<string | number, {
    id: string | number;
    nombre: string;
    unidad: string;
    cantidadRequerida: number;
    stockActual: number;
  }>();

  carrito.forEach((item) => {
    const prod = item.producto as any;
    if (!prod) return;

    // Si deseas que solo aplique impacto si stockVinculado está activo:
    // if (prod.stockVinculado === false) return;

    // Obtener la lista de la receta que guardamos previamente
    const listaInsumos = Array.isArray(prod.receta) ? prod.receta : 
                         Array.isArray(prod.productoInsumos) ? prod.productoInsumos : [];

    listaInsumos.forEach((pi: any) => {
      if (!pi) return;

      // Estructura de la API: pi.insumo contiene el Insumo completo
      const insumoObj = pi.insumo || pi;
      const id = insumoObj?.idInsumo ?? pi?.idInsumo;

      if (id === undefined || id === null) return;

      const nombre = insumoObj?.nombreInsumo || 'Insumo sin nombre';

      // Tratamiento de unidad de medida (si es string u objeto)
      const uMedida = insumoObj?.unidadMedida;
      const unidad = typeof uMedida === 'object' && uMedida !== null 
        ? (uMedida.nombre || uMedida.simbolo || '') 
        : String(uMedida || '');

      const stockActual = Number(insumoObj?.stockActual ?? 0);
      const cantUnitaria = Number(pi?.cantidadConsumo ?? 1);
      const totalRequerido = cantUnitaria * (Number(item.cantidad) || 1);

      if (mapaInsumos.has(id)) {
        mapaInsumos.get(id)!.cantidadRequerida += totalRequerido;
      } else {
        mapaInsumos.set(id, {
          id,
          nombre,
          unidad,
          cantidadRequerida: totalRequerido,
          stockActual
        });
      }
    });
  });

  return Array.from(mapaInsumos.values());
  }, [carrito]);

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
        <h2 className="text-center mb-3 fw-bold" style={{ color: isDark ? '#0bc9f8' : 'inherit' }}>
          Tabla para Calcular y Elegir Productos
        </h2>
        
        {/* Selector de Producto Buscable y Cantidad */}
        <div className="row g-3 mb-4 align-items-end">
          <div className="col-md-7 position-relative">
            <label className="form-label small fw-bold" style={{ color: mutedText }}>Buscar Producto:</label>
            <input 
              type="text"
              className={`form-control ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Escriba el nombre del producto..."
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value);
                setProductoId('');
                setMostrarDropdown(true);
              }}
              onFocus={() => setMostrarDropdown(true)}
              onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
            />

            {/* Menú desplegable flotante para resultados de búsqueda */}
            {mostrarDropdown && (
              <div 
                className={`position-absolute w-100 shadow rounded mt-1 overflow-auto ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                style={{ maxHeight: '220px', zIndex: 1050, border: `1px solid ${borderTheme}`, left: 0 }}
              >
                {productosFiltrados.length === 0 ? (
                  <div className="p-3 small text-muted text-center">No se encontraron productos coincidentes</div>
                ) : (
                  productosFiltrados.map((p) => {
                    const esSeleccionado = String(p.idProducto) === productoId;
                    return (
                      <div
                        key={p.idProducto}
                        className="p-2 border-bottom d-flex justify-content-between align-items-center"
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: esSeleccionado 
                            ? '#0284c7' 
                            : (isDark ? '#27272a' : '#f8fafc')
                        }}
                        onMouseDown={() => {
                          setProductoId(String(p.idProducto));
                          setBusquedaProducto(`${p.nombreProducto} - $${p.precioBase}`);
                          setMostrarDropdown(false);
                        }}
                      >
                        <span className="fw-semibold small">{p.nombreProducto}</span>
                        <span className="badge bg-secondary ms-2">${p.precioBase}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
              className="btn w-100 fw-bold" 
              style={{ backgroundColor: '#0284c7', color: '#ffffff' }} 
              onClick={handleAgregar}
              disabled={!productoId}
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
          
          <div style={{ maxHeight: '95px', overflowY: 'auto', overflowX: 'hidden' }}>
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
          <button className="btn btn-secondary px-4 fw-semibold" onClick={onCancelar}>
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
          <i className="bi bi-boxes text-info fs-5"></i>
          <span className="small fw-bold">Impacto Estimado en el Stock de Insumos / Materia Prima:</span>
        </div>

        <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted" style={{ borderColor: borderTheme }}>
          <div style={{ width: '35%' }}>Insumo Afectado:</div>
          <div style={{ width: '20%' }}>Cant. Requerida:</div>
          <div style={{ width: '20%' }}>Stock Actual:</div>
          <div style={{ width: '25%' }}>Stock Resultante:</div>
        </div>

        <div style={{ maxHeight: '140px', overflowY: 'auto', overflowX: 'hidden' }}>
          {insumosAfectados.length === 0 ? (
            <div className="text-center mt-3 small" style={{ color: mutedText }}>
              {carrito.length === 0 
                ? "Agregue productos arriba para ver el impacto en el stock de insumos." 
                : "Los productos seleccionados no tienen insumos o recetas asociadas."}
            </div>
          ) : (
            insumosAfectados.map((item) => {
              const stockResultante = item.stockActual - item.cantidadRequerida;
              const esInsuficiente = stockResultante < 0;

              return (
                <div 
                  key={String(item.id)} 
                  className="d-flex align-items-center mb-2 border-bottom pb-1 small" 
                  style={{ borderColor: isDark ? '#2d2d30' : '#e2e8f0' }}
                >
                  <div style={{ width: '35%' }} className="fw-semibold text-truncate">{item.nombre}</div>
                  <div style={{ width: '20%' }} className="fw-bold">{item.cantidadRequerida} {item.unidad}</div>
                  <div style={{ width: '20%' }}>{item.stockActual} {item.unidad}</div>
                  <div style={{ width: '25%' }}>
                    <span className={`badge ${esInsuficiente ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                      {stockResultante} {item.unidad} {esInsuficiente ? '(Insuficiente)' : ''}
                    </span>
                  </div>
                </div>
              );
            })
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