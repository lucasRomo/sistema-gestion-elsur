import React, { useState, useEffect, useCallback } from 'react';
import type { Producto } from '../types/Producto';
import { mermaService, type MermaEntity } from '../../../services/mermaService';
import { useTheme } from '../../../Context/ThemeContext';

interface ModalMermasProductosProps {
  show: boolean;
  productos: Producto[];
  onClose: () => void;
  onExito: () => void;
}

interface SelectionItem {
  selected: boolean;
  cantidad: string | number;
  descripcion: string;
  idProducto?: number;
  idInsumo?: number;
}

interface SelectionState {
  [key: string]: SelectionItem;
}

interface InsumoReceta {
  cantidadConsumo: number;
  insumo?: {
    idInsumo?: number;
    id_insumo?: number;
    nombreInsumo?: string;
    unidadMedida?: {
      nombre?: string;
    };
  };
}

type ProductoEnMerma = {
  idProducto: number;
  nombreProducto?: string;
  categoria?: { nombre?: string };
  maquinaNecesaria?: { nombre?: string; nombreMaquina?: string };
};

type MermaConRelaciones = Omit<MermaEntity, 'producto'> & {
  producto?: ProductoEnMerma;
};

export const ModalMermasProductos: React.FC<ModalMermasProductosProps> = ({
  show,
  productos,
  onClose,
  onExito
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Estilos y colores fijos/dinámicos sin depender de .badge ni .text-white
  const bgModal = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const cardBorder = isDark ? '#27272a' : '#e2e8f0';
  const recipeBg = isDark ? 'rgba(0, 0, 0, 0.4)' : '#f1f5f9';
  const recipeBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1';

  const inputBgClass = isDark
    ? 'bg-dark border-secondary'
    : 'bg-white border-secondary-subtle';
  const inputInnerBgClass = isDark
    ? 'bg-black border-secondary'
    : 'bg-white border-secondary-subtle';

  const [tabActiva, setTabActiva] = useState<'registrar' | 'historial'>('registrar');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selections, setSelections] = useState<SelectionState>({});
  const [historial, setHistorial] = useState<MermaConRelaciones[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Estados para controlar el modal de alerta / validación
  const [mostrarAlerta, setMostrarAlerta] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  const [recetasMap, setRecetasMap] = useState<Record<number, InsumoReceta[]>>({});

  // Filtros del Historial
  const [filtroHistorialNombre, setFiltroHistorialNombre] = useState<string>('');
  const [filtroHistorialCategoria, setFiltroHistorialCategoria] = useState<string>('TODOS');
  const [filtroHistorialMaquina, setFiltroHistorialMaquina] = useState<string>('TODOS');

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const res = await fetch('http://localhost:8080/api/mermas');
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.error('Error al cargar historial de mermas:', err);
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;

    cargarHistorial();

    const cargarInsumosDeProductos = async () => {
      const productosConId = productos.filter((p) => p.idProducto != null);

      try {
        const resultados = await Promise.all(
          productosConId.map(async (prod) => {
            try {
              const res = await fetch(
                `http://localhost:8080/api/producto-insumo/producto/${prod.idProducto}`
              );
              if (res.ok) {
                const data = await res.json();
                return { idProducto: prod.idProducto!, data };
              }
            } catch (e) {
              console.error(`Error al cargar insumos del producto ${prod.idProducto}`, e);
            }
            return { idProducto: prod.idProducto!, data: [] };
          })
        );

        const mapa: Record<number, InsumoReceta[]> = {};
        resultados.forEach(({ idProducto, data }) => {
          mapa[idProducto] = data;
        });

        setRecetasMap(mapa);
      } catch (e) {
        console.error('Error al procesar las recetas de productos:', e);
      }
    };

    cargarInsumosDeProductos();
  }, [show, productos, cargarHistorial]);

  if (!show) return null;

  const productosFiltrados = productos.filter((p) =>
    p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleSelection = (key: string, defaultData: { idProducto?: number; idInsumo?: number }) => {
    setSelections((prev) => {
      if (prev[key]?.selected) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: {
          selected: true,
          cantidad: 1,
          descripcion: '',
          ...defaultData
        }
      };
    });
  };

  const updateSelection = (
    key: string,
    field: 'cantidad' | 'descripcion',
    value: string | number
  ) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleGuardarMermas = async () => {
    const keys = Object.keys(selections);
    if (keys.length === 0) {
      setMensajeAlerta('Por favor, selecciona al menos un producto o insumo para registrar la merma.');
      setMostrarAlerta(true);
      return;
    }

    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuario = userLogueado.idUsuario ?? userLogueado.id_usuario ?? 1;

    const payload: MermaEntity[] = keys.map((k) => {
      const item = selections[k];
      return {
        usuario: { idUsuario },
        cantidad: Number(item.cantidad) || 1,
        descripcion: item.descripcion || 'Merma de producto/insumo en stock',
        producto: item.idProducto ? { idProducto: item.idProducto, id_producto: item.idProducto } : undefined,
        insumo: item.idInsumo ? { idInsumo: item.idInsumo, id_insumo: item.idInsumo } : undefined,
        pedido: undefined
      } as unknown as MermaEntity;
    });

    setGuardando(true);
    try {
      await mermaService.registrarMermas(payload);
      setSelections({});
      setBusqueda('');
      await cargarHistorial();
      onExito();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la merma';
      setMensajeAlerta(msg);
      setMostrarAlerta(true);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesCategorias = Array.from(
    new Set(productos.map((p) => p.categoria?.nombre).filter(Boolean) as string[])
  );

  const opcionesMaquinas = Array.from(
    new Set(
      productos
        .map((p) => p.maquinaNecesaria?.nombre || p.maquinaNecesaria?.nombreMaquina)
        .filter(Boolean) as string[]
    )
  );

  const historialFiltrado = historial.filter((m) => {
    const nombreItem = `${m.producto?.nombreProducto || ''} ${m.insumo?.nombreInsumo || ''}`.toLowerCase();
    const cumpleNombre = nombreItem.includes(filtroHistorialNombre.toLowerCase());

    const catNombre = m.producto?.categoria?.nombre || '';
    const cumpleCategoria = filtroHistorialCategoria === 'TODOS' || catNombre === filtroHistorialCategoria;

    const maqNombre = m.producto?.maquinaNecesaria?.nombre || m.producto?.maquinaNecesaria?.nombreMaquina || '';
    const cumpleMaquina = filtroHistorialMaquina === 'TODOS' || maqNombre === filtroHistorialMaquina;

    return cumpleNombre && cumpleCategoria && cumpleMaquina;
  });

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div
          className="modal-content font-monospace shadow-lg"
          style={{
            backgroundColor: bgModal,
            border: '2px solid #eab308',
            borderRadius: '16px',
            color: textColor
          }}
        >
          {/* Header */}
          <div className="modal-header border-bottom border-secondary-subtle pb-3">
            <h5 className="modal-title fw-bold text-warning d-flex align-items-center">
              <i className="bi bi-box-seam-fill me-2 fs-4"></i>
              Gestión de Mermas de Productos
            </h5>
            <button
              type="button"
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`}
              onClick={onClose}
            ></button>
          </div>

          {/* Pestañas */}
          <div className="px-3 pt-3">
            <div className="btn-group w-100">
              <button
                className={`btn btn-sm ${
                  tabActiva === 'registrar' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'
                }`}
                onClick={() => setTabActiva('registrar')}
              >
                <i className="bi bi-plus-circle me-1"></i> Registrar Merma
              </button>
              <button
                className={`btn btn-sm ${
                  tabActiva === 'historial' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'
                }`}
                onClick={() => setTabActiva('historial')}
              >
                <i className="bi bi-journal-text me-1"></i> Historial ({historialFiltrado.length})
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body my-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {tabActiva === 'registrar' ? (
              <div>
                <div className="position-relative mb-3">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-warning"></i>
                  <input
                    type="text"
                    className={`form-control ps-5 ${inputBgClass}`}
                    style={{ color: textColor }}
                    placeholder="Escribí el nombre del producto a buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                {productosFiltrados.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No se encontraron productos que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {productosFiltrados.map((prod) => {
                      if (!prod.idProducto) return null;
                      const idProd = prod.idProducto;
                      const keyProd = `prod-${idProd}`;
                      const prodSelected = !!selections[keyProd]?.selected;
                      const recetaInsumos = recetasMap[idProd] || [];

                      return (
                        <div
                          key={keyProd}
                          className="p-3 rounded border"
                          style={{
                            backgroundColor: cardBg,
                            borderColor: prodSelected ? '#eab308' : cardBorder
                          }}
                        >
                          <div className="form-check d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                id={keyProd}
                                checked={prodSelected}
                                onChange={() => toggleSelection(keyProd, { idProducto: idProd })}
                              />
                              <label
                                className="form-check-label fw-bold cursor-pointer m-0"
                                style={{ color: textColor }}
                                htmlFor={keyProd}
                              >
                                <i className="bi bi-box-seam me-2 text-warning"></i>
                                {prod.nombreProducto}
                              </label>
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                              {prod.categoria && (
                                <span
                                  className="px-2 py-1 rounded small fw-semibold"
                                  style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: isDark ? '#27272a' : '#e2e8f0',
                                    color: isDark ? '#f4f4f5' : '#0f172a',
                                    border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
                                  }}
                                >
                                  {prod.categoria.nombre}
                                </span>
                              )}
                              <span
                                className="px-2 py-1 rounded small fw-semibold"
                                style={{
                                  fontSize: '0.75rem',
                                  backgroundColor: isDark ? '#18181b' : '#e0f2fe',
                                  color: isDark ? '#38bdf8' : '#0369a1',
                                  border: `1px solid ${isDark ? '#0284c7' : '#7dd3fc'}`
                                }}
                              >
                                Stock: {prod.stock}
                              </span>
                            </div>
                          </div>

                          {prodSelected && (
                            <div
                              className="mt-3 pt-2 border-top row g-2"
                              style={{ borderColor: cardBorder }}
                            >
                              <div className="col-md-4">
                                <label className="form-label small text-warning m-0 fw-bold">
                                  Cantidad Pérdida:
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className={`form-control form-control-sm ${inputInnerBgClass}`}
                                  style={{ color: textColor }}
                                  value={selections[keyProd]?.cantidad ?? ''}
                                  onChange={(e) => updateSelection(keyProd, 'cantidad', e.target.value)}
                                />
                              </div>
                              <div className="col-md-8">
                                <label className="form-label small text-warning m-0 fw-bold">
                                  Motivo / Defecto:
                                </label>
                                <input
                                  type="text"
                                  className={`form-control form-control-sm ${inputInnerBgClass}`}
                                  style={{ color: textColor }}
                                  placeholder="Ej: Fallo de impresión, corte desfasado..."
                                  value={selections[keyProd]?.descripcion || ''}
                                  onChange={(e) => updateSelection(keyProd, 'descripcion', e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {recetaInsumos.length > 0 && (
                            <div className="mt-3 ms-3 ps-3 border-start border-warning border-2">
                              <span className="small fw-bold text-warning d-block mb-2">
                                <i className="bi bi-diagram-3-fill me-1"></i> Insumos de la Receta:
                              </span>
                              {recetaInsumos.map((rec, rIdx) => {
                                const ins = rec.insumo || {};
                                const idIns = ins.idInsumo || ins.id_insumo;
                                if (!idIns) return null;
                                const keyIns = `ins-${idProd}-${idIns}-${rIdx}`;
                                const insSelected = !!selections[keyIns]?.selected;

                                return (
                                  <div
                                    key={keyIns}
                                    className="mb-2 p-2 rounded border"
                                    style={{
                                      backgroundColor: recipeBg,
                                      borderColor: recipeBorder
                                    }}
                                  >
                                    <div className="form-check d-flex align-items-center justify-content-between">
                                      <div className="d-flex align-items-center gap-2">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={keyIns}
                                          checked={insSelected}
                                          onChange={() => toggleSelection(keyIns, { idInsumo: idIns, idProducto: idProd })}
                                        />
                                        <label
                                          className="form-check-label small cursor-pointer m-0"
                                          style={{ color: textColor }}
                                          htmlFor={keyIns}
                                        >
                                          <i className="bi bi-layers me-1 text-info"></i>
                                          {ins.nombreInsumo}
                                        </label>
                                      </div>
                                      <span
                                        className="px-2 py-1 rounded small fw-semibold"
                                        style={{
                                          fontSize: '0.75rem',
                                          backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#e0f2fe',
                                          color: isDark ? '#38bdf8' : '#0369a1',
                                          border: `1px solid ${isDark ? '#0284c7' : '#7dd3fc'}`
                                        }}
                                      >
                                        Consumo por unidad: {rec.cantidadConsumo} {ins.unidadMedida?.nombre || ''}
                                      </span>
                                    </div>

                                    {insSelected && (
                                      <div className="mt-2 row g-2">
                                        <div className="col-md-4">
                                          <input
                                            type="number"
                                            step="0.01"
                                            className={`form-control form-control-sm ${inputBgClass}`}
                                            style={{ color: textColor }}
                                            placeholder="Cant. perdida"
                                            value={selections[keyIns]?.cantidad ?? ''}
                                            onChange={(e) => updateSelection(keyIns, 'cantidad', e.target.value)}
                                          />
                                        </div>
                                        <div className="col-md-8">
                                          <input
                                            type="text"
                                            className={`form-control form-control-sm ${inputBgClass}`}
                                            style={{ color: textColor }}
                                            placeholder={`Motivo falla insumo en ${prod.nombreProducto}`}
                                            value={selections[keyIns]?.descripcion || ''}
                                            onChange={(e) =>
                                              updateSelection(keyIns, 'descripcion', e.target.value)
                                            }
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Filtros */}
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <div className="position-relative">
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-warning"></i>
                      <input
                        type="text"
                        className={`form-control form-control-sm ps-5 ${inputBgClass}`}
                        style={{ color: textColor }}
                        placeholder="Buscar por nombre..."
                        value={filtroHistorialNombre}
                        onChange={(e) => setFiltroHistorialNombre(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <select
                      className={`form-select form-select-sm ${inputBgClass}`}
                      style={{ color: textColor }}
                      value={filtroHistorialCategoria}
                      onChange={(e) => setFiltroHistorialCategoria(e.target.value)}
                    >
                      <option value="TODOS">Todas las Categorías</option>
                      {opcionesCategorias.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select
                      className={`form-select form-select-sm ${inputBgClass}`}
                      style={{ color: textColor }}
                      value={filtroHistorialMaquina}
                      onChange={(e) => setFiltroHistorialMaquina(e.target.value)}
                    >
                      <option value="TODOS">Todas las Máquinas</option>
                      {opcionesMaquinas.map((maq, idx) => (
                        <option key={idx} value={maq}>
                          {maq}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {cargandoHistorial ? (
                  <div className="text-center py-4 text-muted">Cargando historial de mermas...</div>
                ) : historialFiltrado.length === 0 ? (
                  <div className="text-center py-4 text-muted">No se encontraron registros de mermas.</div>
                ) : (
                  <div className="table-responsive">
                    <table
                      className={`table ${
                        isDark ? 'table-dark table-hover' : 'table-hover table-striped'
                      } align-middle small`}
                      style={{ color: textColor }}
                    >
                      <thead>
                        <tr
                          className="text-uppercase"
                          style={{
                            color: isDark ? '#eab308' : '#854d0e',
                            backgroundColor: isDark ? '#1d1d1d' : '#f8fafc'
                          }}
                        >
                          <th>Fecha</th>
                          <th>Origen / Ítem</th>
                          <th>Categoría / Máquina</th>
                          <th className="text-center">Cant.</th>
                          <th>Motivo / Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialFiltrado.map((m, idx) => {
                          const esInsumo = Boolean(m.insumo);

                          return (
                            <tr key={m.idMerma ?? `hist-${idx}`}>
                              <td className="text-nowrap">
                                {m.fechaMerma ? new Date(m.fechaMerma).toLocaleString('es-AR') : '-'}
                              </td>
                              <td className="py-2">
                                <div className="d-flex flex-column gap-1">
                                  {esInsumo ? (
                                    <>
                                      <div className="d-flex align-items-center gap-2">
                                        <span
                                          className="px-2 py-1 rounded small fw-bold font-monospace"
                                          style={{
                                            fontSize: '0.75rem',
                                            backgroundColor: '#eab308',
                                            color: '#000000'
                                          }}
                                        >
                                          <i className="bi bi-layers-fill me-1"></i>INSUMO
                                        </span>
                                        <span className="fw-bold" style={{ color: textColor }}>
                                          {m.insumo?.nombreInsumo}
                                        </span>
                                      </div>
                                      {m.producto?.nombreProducto && (
                                        <div className="small text-muted ms-1 d-flex align-items-center gap-1">
                                          <i className="bi bi-arrow-return-right text-warning"></i>
                                          <span>Pertenece al producto:</span>
                                          <span
                                            className={`fw-semibold ${
                                              isDark ? 'text-warning' : 'text-warning-emphasis'
                                            }`}
                                          >
                                            {m.producto.nombreProducto}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="px-2 py-1 rounded small fw-bold font-monospace"
                                        style={{
                                          fontSize: '0.75rem',
                                          backgroundColor: '#2563eb',
                                          color: '#ffffff'
                                        }}
                                      >
                                        <i className="bi bi-box-seam-fill me-1"></i>PRODUCTO
                                      </span>
                                      <span
                                        className={`fw-bold ${
                                          isDark ? 'text-info' : 'text-primary-emphasis'
                                        }`}
                                      >
                                        {m.producto?.nombreProducto || 'Producto'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  {m.producto?.categoria?.nombre && (
                                    <span
                                      className="align-self-start px-2 py-1 rounded small fw-semibold"
                                      style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: isDark ? '#27272a' : '#e2e8f0',
                                        color: isDark ? '#f4f4f5' : '#0f172a',
                                        border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
                                      }}
                                    >
                                      {m.producto.categoria.nombre}
                                    </span>
                                  )}
                                  {(m.producto?.maquinaNecesaria?.nombre ||
                                    m.producto?.maquinaNecesaria?.nombreMaquina) && (
                                    <span
                                      className="align-self-start px-2 py-1 rounded small fw-semibold"
                                      style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#fef9c3',
                                        color: isDark ? '#fde047' : '#854d0e',
                                        border: `1px solid ${isDark ? '#ca8a04' : '#fef08a'}`
                                      }}
                                    >
                                      <i className="bi bi-cpu me-1"></i>
                                      {m.producto.maquinaNecesaria.nombre ||
                                        m.producto.maquinaNecesaria.nombreMaquina}
                                    </span>
                                  )}
                                  {!m.producto?.categoria?.nombre &&
                                    !m.producto?.maquinaNecesaria?.nombre &&
                                    !m.producto?.maquinaNecesaria?.nombreMaquina && (
                                      <span className="text-muted small">-</span>
                                    )}
                                </div>
                              </td>
                              <td className="text-center fw-bold text-danger fs-6">-{m.cantidad}</td>
                              <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{m.descripcion}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-secondary-subtle pt-2">
            <button
              type="button"
              className={`btn ${isDark ? 'btn-secondary' : 'btn-secondary'} px-4 fw-bold`}
              onClick={onClose}
            >
              Volver
            </button>
            {tabActiva === 'registrar' && (
              <button
                type="button"
                className="btn btn-success fw-bold px-4"
                disabled={guardando}
                onClick={handleGuardarMermas}
              >
                {guardando ? 'Guardando...' : 'Registrar Mermas'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Modal/Cartel de Advertencia Personalizado */}
      {/* Modal / Cartel de Advertencia Personalizado (Adaptativo Claro/Oscuro) */}
      {mostrarAlerta && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 2000 }}
        >
          <div
            className="rounded-4 p-4 text-center shadow-lg mx-3 font-monospace"
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              border: isDark ? '1px solid #a855f7' : '1px solid #cbd5e1',
              color: textColor
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#a855f7',
                color: isDark ? '#000000' : '#ffffff',
                fontSize: '2rem'
              }}
            >
              <i className="bi bi-exclamation-lg"></i>
            </div>
            <h3 className="fw-bold mb-2" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
              ¡Atención!
            </h3>
            <p
              className="mb-4 small"
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.4',
                color: isDark ? '#a1a1aa' : '#64748b'
              }}
            >
              {mensajeAlerta}
            </p>
            <button
              type="button"
              className="btn btn-danger fw-bold px-4 py-2"
              style={{ borderRadius: '8px', minWidth: '120px' }}
              onClick={() => setMostrarAlerta(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};