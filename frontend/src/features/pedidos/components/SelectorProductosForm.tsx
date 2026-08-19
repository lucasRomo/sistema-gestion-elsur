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
  pedidosPendientes?: any[];
  onSiguiente: () => void;
  onCancelar: () => void;
}

const MARGEN_SEGURIDAD_FALLBACK = 0;
// Tolerancia de unidades restantes para productos de venta directa sin receta
const TOLERANCIA_PRODUCTO_DIRECTO = 3;

const MARGEN_MERMA_RESPALDO = 5;

export const SelectorProductosForm: React.FC<Props> = ({ 
  productos, 
  carrito, 
  setCarrito, 
  categorias,
  categoriaSeleccionadaId,
  setCategoriaSeleccionadaId,
  maquinas = [],
  pedidosPendientes = [],
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

  // Modales
  const [showModalMaquinas, setShowModalMaquinas] = useState(false);
  const [conflictosMaquinas, setConflictosMaquinas] = useState<{
    productoNombre: string;
    maquinaNombre: string;
    estado: string;
  }[]>([]);

  const [showModalStockMinimo, setShowModalStockMinimo] = useState(false);
  const [insumosCriticos, setInsumosCriticos] = useState<{
    nombre: string;
    stockResultante: number;
    stockMinimo: number;
    unidad: string;
    tipo: 'Insumo' | 'Producto Directo';
  }[]>([]);

  const [showModalStockError, setShowModalStockError] = useState(false);
  const [insumoFaltante, setInsumoFaltante] = useState<{
    nombre: string;
    faltante: number;
    unidad: string;
    tipo: 'Insumo' | 'Producto Directo';
  } | null>(null);

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
        receta: recetaInsumos.length > 0 ? recetaInsumos : (prodSeleccionado as any).receta
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

  // Agrupa y calcula el consumo de Insumos y Productos Directos
  const elementosAfectados = React.useMemo(() => {
    const mapaElementos = new Map<string, {
      key: string;
      id: string | number;
      nombre: string;
      unidad: string;
      cantPedidoActual: number;
      cantReservadaPendientes: number;
      cantTotalRequerida: number;
      stockActual: number;
      stockMinimo: number;
      tipo: 'Insumo' | 'Producto Directo';
    }>();

    const procesarItem = (prod: any, cantidadReq: number, esPedidoActual: boolean) => {
      if (!prod) return;

      const listaInsumos = Array.isArray(prod.receta) ? prod.receta : 
                           Array.isArray(prod.productoInsumos) ? prod.productoInsumos : [];

      // CASO A: TIENE RECETA -> Evalúa Insumos
      if (listaInsumos.length > 0) {
        listaInsumos.forEach((pi: any) => {
          if (!pi) return;
          const insumoObj = pi.insumo || pi;
          const id = insumoObj?.idInsumo ?? pi?.idInsumo;
          if (id === undefined || id === null) return;

          const key = `INSUMO_${id}`;
          const nombre = insumoObj?.nombreInsumo || 'Insumo sin nombre';
          const uMedida = insumoObj?.unidadMedida;
          const unidad = typeof uMedida === 'object' && uMedida !== null 
            ? (uMedida.nombre || uMedida.simbolo || '') 
            : String(uMedida || '');

          const stockActual = Number(insumoObj?.stockActual ?? 0);
          const stockMinimo = Number(insumoObj?.stockMinimo ?? insumoObj?.stock_minimo ?? MARGEN_SEGURIDAD_FALLBACK);
          const cantUnitaria = Number(pi?.cantidadConsumo ?? 1);
          const totalRequerido = cantUnitaria * cantidadReq;

          if (mapaElementos.has(key)) {
            const item = mapaElementos.get(key)!;
            if (esPedidoActual) item.cantPedidoActual += totalRequerido;
            else item.cantReservadaPendientes += totalRequerido;
            item.cantTotalRequerida += totalRequerido;
          } else {
            mapaElementos.set(key, {
              key,
              id,
              nombre,
              unidad,
              cantPedidoActual: esPedidoActual ? totalRequerido : 0,
              cantReservadaPendientes: esPedidoActual ? 0 : totalRequerido,
              cantTotalRequerida: totalRequerido,
              stockActual,
              stockMinimo,
              tipo: 'Insumo'
            });
          }
        });
      } 
      // CASO B: SIN RECETA -> Evalúa el producto directo aplicando la tolerancia de 3 unidades
      else {
        const id = prod.idProducto ?? prod.id;
        if (id === undefined || id === null) return;

        const key = `PROD_${id}`;
        const nombre = prod.nombreProducto || prod.nombre || 'Producto sin nombre';
        const stockActual = Number(prod.stockActual ?? prod.stock ?? 0);
        
        const stockMinimoBase = Number(prod.stockMinimo ?? prod.stock_minimo ?? 0);
        const stockMinimo = Math.max(stockMinimoBase, TOLERANCIA_PRODUCTO_DIRECTO);

        if (mapaElementos.has(key)) {
          const item = mapaElementos.get(key)!;
          if (esPedidoActual) item.cantPedidoActual += cantidadReq;
          else item.cantReservadaPendientes += cantidadReq;
          item.cantTotalRequerida += cantidadReq;
        } else {
          mapaElementos.set(key, {
            key,
            id,
            nombre,
            unidad: 'uds',
            cantPedidoActual: esPedidoActual ? cantidadReq : 0,
            cantReservadaPendientes: esPedidoActual ? 0 : cantidadReq,
            cantTotalRequerida: cantidadReq,
            stockActual,
            stockMinimo,
            tipo: 'Producto Directo'
          });
        }
      }
    };

    // 1. Procesar elementos del carrito
    carrito.forEach((item) => {
      procesarItem(item.producto, Number(item.cantidad) || 1, true);
    });

    // 2. Procesar pedidos pendientes
    if (Array.isArray(pedidosPendientes)) {
      pedidosPendientes.forEach((ped) => {
        const detalles = ped.detalles || ped.detallesPedido || [];
        detalles.forEach((det: any) => {
          const idProd = det.producto?.idProducto ?? det.idProducto;
          const prodCompleto = productos.find((p: any) => p.idProducto === idProd) || det.producto;
          if (prodCompleto) {
            procesarItem(prodCompleto, Number(det.cantidad || 1), false);
          }
        });
      });
    }

    return Array.from(mapaElementos.values()).filter(item => item.cantPedidoActual > 0);
  }, [carrito, pedidosPendientes, productos]);

  const handleContinuarSiguiente = () => {
    const elementoDeficiente = elementosAfectados.find(
      (el) => el.stockActual - el.cantTotalRequerida < 0
    );

    if (elementoDeficiente) {
      const resultante = elementoDeficiente.stockActual - elementoDeficiente.cantTotalRequerida;
      setInsumoFaltante({
        nombre: elementoDeficiente.nombre,
        faltante: Math.abs(resultante),
        unidad: elementoDeficiente.unidad,
        tipo: elementoDeficiente.tipo,
      });
      setShowModalStockError(true);
      return;
    }

    const elementosBajos = elementosAfectados
      .filter((el) => {
        const saldoReal = el.stockActual - el.cantTotalRequerida;
        const saldoConMerma = saldoReal - MARGEN_MERMA_RESPALDO;
        
        return saldoReal >= 0 && saldoConMerma <= el.stockMinimo;
      })
      .map((el) => ({
        nombre: el.nombre,
        stockResultante: el.stockActual - el.cantTotalRequerida - MARGEN_MERMA_RESPALDO,
        stockMinimo: el.stockMinimo,
        unidad: el.unidad,
        tipo: el.tipo,
      }));

    if (elementosBajos.length > 0) {
      setInsumosCriticos(elementosBajos);
      setShowModalStockMinimo(true);
      return;
    }

    evaluarMaquinasYAvanzar();
  };

  const evaluarMaquinasYAvanzar = () => {
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

      if (!maquinaObj) maquinaObj = maquinaAsociada;
      if (!maquinaObj) return;

      const nombreMaquina = (maquinaObj.nombre || maquinaObj.nombreMaquina || '').trim();
      const estadoRaw = (maquinaObj.estado || '').trim().toUpperCase();
      const estadoNormalizado = estadoRaw.replace(/_/g, ' ');

      if (!nombreMaquina || nombreMaquina.toLowerCase().includes('no aplica')) return;

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
          <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted" style={{ borderColor: borderTheme}}>
            <div style={{ width: '40%' }}>Lista de Productos:</div>
            <div style={{ width: '20%' }}>Cantidad:</div>
            <div style={{ width: '20%' }}>Precio Unitario:</div>
            <div style={{ width: '20%' }}>SubTotal:</div>
          </div>
          
          <div style={{ height: '135px', overflowY: 'auto', overflowX: 'hidden' }}>
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
          <button className="btn btn-danger px-4 fw-semibold" onClick={onCancelar}>
            Cancelar
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
        className="card p-4 w-100 rounded mt-2 shadow-sm" 
        style={{ 
          maxWidth: '1570px', 
          backgroundColor: containerBg, 
          color: textPrimary, 
          border: `1px solid ${borderTheme}` 
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-boxes text-info fs-8"></i>
          <span className="small fw-bold">Impacto Estimado en el Stock de Insumos y Productos:</span>
        </div>

        <div className="d-flex border-bottom pb-2 mb-2 small fw-bold text-muted" style={{ borderColor: borderTheme }}>
          <div style={{ width: '25%' }}>Insumo / Producto:</div>
          <div style={{ width: '18%' }}>Unidad de Insumos/Productos:</div>
          <div style={{ width: '18%' }}>Insumos/Productos Reservados:</div>
          <div style={{ width: '18%' }}>Stock Actual:</div>
          <div style={{ width: '21%' }}>Stock Resultante:</div>
        </div>

        <div style={{ height: '60px', overflowY: 'auto', overflowX: 'hidden' }}>
          {elementosAfectados.length === 0 ? (
            <div className="text-center mt-3 small" style={{ color: mutedText }}>
              {carrito.length === 0 
                ? "Agregue productos arriba para ver el impacto en el stock." 
                : "No se identificaron requerimientos de stock."}
            </div>
          ) : (
            elementosAfectados.map((item) => {
              const saldoFisico = item.stockActual - item.cantTotalRequerida;
              const stockResultante = saldoFisico - MARGEN_MERMA_RESPALDO;
              
              const esInsuficiente = saldoFisico < 0; 
              const esMargenBajo = saldoFisico >= 0 && stockResultante <= item.stockMinimo;

              let badgeClass = 'bg-success text-white';
              let badgeTexto = `${stockResultante} ${item.unidad}`;

              if (esInsuficiente) {
                badgeClass = 'bg-danger text-white';
                badgeTexto = `${saldoFisico} ${item.unidad} (Insuficiente)`; 
              } else if (esMargenBajo) {
                badgeClass = 'bg-warning text-dark';
                badgeTexto = `${stockResultante} ${item.unidad} (Stock Límite)`;
              }

              return (
                <div 
                  key={item.key} 
                  className="d-flex align-items-center mb-2 border-bottom pb-1 small" 
                  style={{ borderColor: isDark ? '#2d2d30' : '#e2e8f0' }}
                >
                  <div style={{ width: '25%' }} className="fw-semibold text-truncate">
                    {item.nombre}
                    <span className="ms-1 text-muted" style={{ fontSize: '0.75rem' }}>
                      ({item.tipo})
                    </span>
                  </div>
                  
                  {/* Consumo Pedido: únicamente la cantidad limpia del carrito actual */}
                  {/* Consumo Pedido */}
<div style={{ width: '18%' }} className="fw-bold text-info">
  {item.cantPedidoActual} {item.unidad}
  {item.cantReservadaPendientes === 0 && (
    <span className="d-block text-muted" style={{ fontSize: '0.70rem', fontWeight: 'normal' }}>
      (+{MARGEN_MERMA_RESPALDO} Respaldo)
    </span>
  )}
</div>

{/* Reserva Pendientes */}
<div style={{ width: '18%' }} className="text-warning">
  {item.cantReservadaPendientes} {item.unidad}
  {item.cantReservadaPendientes > 0 && (
    <span className="d-block text-muted" style={{ fontSize: '0.70rem', fontWeight: 'normal' }}>
      (+{MARGEN_MERMA_RESPALDO} Respaldo)
    </span>
  )}
</div>

                  <div style={{ width: '18%' }}>{item.stockActual} {item.unidad}</div>
                  <div style={{ width: '21%' }}>
                    <span className={`badge ${badgeClass}`}>
                      {badgeTexto}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: ERROR POR STOCK INSUFICIENTE */}
      {showModalStockError && insumoFaltante && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white" 
              style={{ border: '2px solid #dc3545', backgroundColor: '#18181b', borderRadius: '12px' }}
            >
              <div className="text-center mb-3">
                <i className="bi bi-x-circle-fill fs-1 text-danger"></i>
                <h5 className="fw-bold mt-2 text-danger">Stock Insuficiente</h5>
              </div>

              <p className="small text-light text-center">
                El {insumoFaltante.tipo.toLowerCase()} <b>"{insumoFaltante.nombre}"</b> no tiene suficiente stock considerando los pedidos pendientes y el actual.
              </p>

              <p className="small text-secondary text-center">
                Faltan <b>{insumoFaltante.faltante} {insumoFaltante.unidad}</b> para cubrir la cantidad requerida.
              </p>

              <div className="d-flex justify-content-center mt-3">
                <button 
                  className="btn btn-sm btn-danger px-4 fw-bold" 
                  onClick={() => setShowModalStockError(false)}
                >
                  Entendido / Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADVERTENCIA POR TOLERANCIA / MARGEN DE STOCK MÍNIMO */}
      {showModalStockMinimo && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content p-4 text-white" 
              style={{ border: '2px solid #ffc107', backgroundColor: '#18181b', borderRadius: '12px' }}
            >
              <div className="text-center mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-1 text-warning"></i>
                <h5 className="fw-bold mt-2 text-warning">Stock Restante Crítico</h5>
              </div>

              <p className="small text-light">
                El stock disponible quedará dentro del límite de tolerancia para los siguientes ítems teniendo en cuenta las 5 unidades de respaldo:
              </p>

              <div className="list-group mb-3" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {insumosCriticos.map((ins, idx) => (
                  <div key={idx} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold d-block">{ins.nombre}</span>
                      <small className="text-muted">{ins.tipo}</small>
                    </div>
                    <span className="badge bg-warning text-dark">
                      Quedarán {ins.stockResultante} {ins.unidad} (Tolerancia: {ins.stockMinimo} {ins.unidad})
                    </span>
                  </div>
                ))}
              </div>

              <p className="small text-secondary mb-4 text-center">
                Se recomienda reponer stock. ¿Deseas continuar con el pedido de todas formas?
              </p>

              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-sm btn-secondary px-3" 
                  onClick={() => setShowModalStockMinimo(false)}
                >
                  Cancelar y revisar
                </button>
                <button 
                  className="btn btn-sm btn-warning px-3 fw-bold" 
                  style={{ color: '#ffff' }}
                  onClick={() => {
                    setShowModalStockMinimo(false);
                    evaluarMaquinasYAvanzar();
                  }}
                >
                  Continuar de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADVERTENCIA POR MÁQUINAS FUERA DE SERVICIO */}
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