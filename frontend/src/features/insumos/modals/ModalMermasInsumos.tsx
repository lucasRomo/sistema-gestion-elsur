import React, { useState, useEffect } from 'react';
import type { Insumo } from '../types/Insumo';
import { mermaService, type MermaEntity } from '../../../services/mermaService';
import { useTheme } from '../../../Context/ThemeContext';

interface ModalMermasInsumosProps {
  show: boolean;
  insumos: Insumo[];
  onClose: () => void;
  onExito: () => void;
}

interface SelectionState {
  [idInsumo: number]: {
    selected: boolean;
    cantidad: string | number;
    descripcion: string;
  };
}

export const ModalMermasInsumos: React.FC<ModalMermasInsumosProps> = ({ show, insumos, onClose, onExito }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Paleta de colores adaptativa estándar
  const bgModal = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const cardBorder = isDark ? '#27272a' : '#e2e8f0';
  const inputBgClass = isDark ? 'bg-dark border-secondary' : 'bg-white border-secondary-subtle';
  const inputInnerBgClass = isDark ? 'bg-black border-secondary' : 'bg-white border-secondary-subtle';

  const [tabActiva, setTabActiva] = useState<'registrar' | 'historial'>('registrar');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selections, setSelections] = useState<SelectionState>({});
  const [historial, setHistorial] = useState<MermaEntity[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Modal de Advertencia
  const [mostrarAlerta, setMostrarAlerta] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  // Filtros de Historial
  const [filtroHistorialNombre, setFiltroHistorialNombre] = useState<string>('');
  const [filtroHistorialProducto, setFiltroHistorialProducto] = useState<string>('TODOS');
  const [filtroHistorialProveedor, setFiltroHistorialProveedor] = useState<string>('TODOS');

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const res = await fetch('http://localhost:8080/api/mermas');
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (err) {
      console.error("Error al cargar historial de mermas:", err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    if (show) {
      cargarHistorial();
    }
  }, [show]);

  if (!show) return null;

  const insumosFiltrados = insumos.filter(i => 
    i.nombreInsumo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleSelection = (idInsumo: number) => {
    setSelections(prev => {
      if (prev[idInsumo]?.selected) {
        const copy = { ...prev };
        delete copy[idInsumo];
        return copy;
      } else {
        return {
          ...prev,
          [idInsumo]: {
            selected: true,
            cantidad: 1,
            descripcion: ''
          }
        };
      }
    });
  };

  const updateSelection = (idInsumo: number, field: 'cantidad' | 'descripcion', value: any) => {
    setSelections(prev => ({
      ...prev,
      [idInsumo]: {
        ...prev[idInsumo],
        [field]: value
      }
    }));
  };

  const handleGuardarMermas = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = Object.keys(selections).map(Number);
    if (ids.length === 0) {
      setMensajeAlerta('Por favor, selecciona al menos un insumo para registrar la merma.');
      setMostrarAlerta(true);
      return;
    }

    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuario = userLogueado.idUsuario ?? userLogueado.id_usuario ?? 1;

    const payload: any[] = ids.map(idInsumo => ({
      usuario: { idUsuario },
      cantidad: Number(selections[idInsumo].cantidad) || 1,
      descripcion: selections[idInsumo].descripcion || 'Merma de insumo en stock',
      insumo: { idInsumo, id_insumo: idInsumo },
      producto: null,
      pedido: null
    }));
    
    setGuardando(true);
    try {
      await mermaService.registrarMermas(payload);
      setSelections({});
      setBusqueda('');
      await cargarHistorial();
      onExito();
    } catch (err: any) {
      setMensajeAlerta(err.message || 'Error al guardar la merma');
      setMostrarAlerta(true);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerNombreProveedor = (merma: MermaEntity): string => {
    if (merma.insumo) {
      const provDirecto = (merma.insumo as any)?.proveedor;
      if (provDirecto) {
        return provDirecto.nombreProveedor || provDirecto.razonSocial || provDirecto.nombre || '';
      }
      const insumoEncontrado = insumos.find(i => i.idInsumo === merma.insumo?.idInsumo);
      if (insumoEncontrado?.proveedor) {
        return insumoEncontrado.proveedor.nombreComercial || (insumoEncontrado.proveedor as any).razonSocial || (insumoEncontrado.proveedor as any).nombre || '';
      }
    }
    return '';
  };

  const opcionesProductos = Array.from(
    new Set(
      historial
        .map(m => m.producto?.nombreProducto || m.insumo?.nombreInsumo)
        .filter(Boolean) as string[]
    )
  );

  const opcionesProveedores = Array.from(
    new Set(
      historial
        .map(m => obtenerNombreProveedor(m))
        .filter(Boolean)
    )
  );

  const historialFiltrado = historial.filter(m => {
    const nombreItem = (m.insumo?.nombreInsumo || m.producto?.nombreProducto || '').toLowerCase();
    const cumpleNombre = nombreItem.includes(filtroHistorialNombre.toLowerCase());
    
    const itemNombreExacto = m.producto?.nombreProducto || m.insumo?.nombreInsumo || '';
    const cumpleProducto = filtroHistorialProducto === 'TODOS' || itemNombreExacto === filtroHistorialProducto;

    const proveedorNombre = obtenerNombreProveedor(m);
    const cumpleProveedor = filtroHistorialProveedor === 'TODOS' || proveedorNombre === filtroHistorialProveedor;

    return cumpleNombre && cumpleProducto && cumpleProveedor;
  });

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <form 
          onSubmit={handleGuardarMermas}
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
              <i className="bi bi-exclamation-diamond-fill me-2 fs-4"></i>
              Gestión de Mermas de Insumos
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          {/* Navegación por pestañas */}
          <div className="px-3 pt-3">
            <div className="btn-group w-100">
              <button 
                type="button"
                className={`btn btn-sm ${tabActiva === 'registrar' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('registrar')}
              >
                <i className="bi bi-plus-circle me-1"></i> Registrar Merma
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${tabActiva === 'historial' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('historial')}
              >
                <i className="bi bi-journal-text me-1"></i> Historial de Mermas ({historialFiltrado.length})
              </button>
            </div>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body my-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {tabActiva === 'registrar' ? (
              <div>
                <div className="position-relative mb-3">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-warning"></i>
                  <input 
                    type="text"
                    className={`form-control ps-5 ${inputBgClass}`}
                    style={{ color: textColor }}
                    placeholder="Escribí el nombre del insumo a buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                {insumosFiltrados.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No se encontraron insumos que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {insumosFiltrados.map((insumo) => {
                      const idIns = insumo.idInsumo!;
                      const selected = !!selections[idIns]?.selected;
                      const uni = insumo.unidadMedida?.nombre || 'unid.';

                      return (
                        <div 
                          key={idIns} 
                          className="p-3 rounded border"
                          style={{ 
                            backgroundColor: cardBg, 
                            borderColor: selected ? '#eab308' : cardBorder 
                          }}
                        >
                          <div className="form-check d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                id={`insumo-merma-${idIns}`}
                                checked={selected}
                                onChange={() => toggleSelection(idIns)}
                              />
                              <label className="form-check-label fw-bold cursor-pointer m-0" style={{ color: textColor }} htmlFor={`insumo-merma-${idIns}`}>
                                {insumo.nombreInsumo}
                              </label>
                            </div>
                            <span 
                              className="px-2 py-1 rounded small fw-semibold"
                              style={{
                                fontSize: '0.75rem',
                                backgroundColor: isDark ? '#27272a' : '#e2e8f0',
                                color: isDark ? '#f4f4f5' : '#0f172a',
                                border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
                              }}
                            >
                              Stock Actual: {insumo.stockActual} {uni}
                            </span>
                          </div>

                          {selected && (
                            <div className="mt-3 pt-2 border-top row g-2" style={{ borderColor: cardBorder }}>
                              <div className="col-md-4">
                                <label className="form-label small text-warning m-0 fw-bold">Cantidad Pérdida:</label>
                                <div className="input-group input-group-sm">
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    min="0.01"
                                    className={`form-control ${inputInnerBgClass}`}
                                    style={{ color: textColor }}
                                    value={selections[idIns]?.cantidad ?? ''}
                                    onChange={(e) => updateSelection(idIns, 'cantidad', e.target.value)}
                                    required
                                  />
                                  <span 
                                    className="input-group-text small fw-semibold"
                                    style={{
                                      backgroundColor: isDark ? '#27272a' : '#e2e8f0',
                                      color: textColor,
                                      borderColor: isDark ? '#3f3f46' : '#cbd5e1'
                                    }}
                                  >
                                    {uni}
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-8">
                                <label className="form-label small text-warning m-0 fw-bold">Motivo / Descripción:</label>
                                <input 
                                  type="text" 
                                  className={`form-control form-control-sm ${inputInnerBgClass}`}
                                  style={{ color: textColor }}
                                  placeholder="Ej: Material roto, vencido, tirado..."
                                  pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
                                  value={selections[idIns]?.descripcion || ''}
                                  onChange={(e) => updateSelection(idIns, 'descripcion', e.target.value)}
                                  onInvalid={(e) => {
                                    const input = e.target as HTMLInputElement;
                                    if (input.validity.valueMissing) {
                                      input.setCustomValidity('Completa este campo.');
                                    } else if (input.validity.patternMismatch) {
                                      input.setCustomValidity('No se permiten números en el motivo de la merma.');
                                    }
                                  }}
                                  onInput={(e) => {
                                    (e.target as HTMLInputElement).setCustomValidity('');
                                  }}
                                  required
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
            ) : (
              /* TAB HISTORIAL */
              <div>
                {/* FILTROS DE HISTORIAL */}
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
                      value={filtroHistorialProducto}
                      onChange={(e) => setFiltroHistorialProducto(e.target.value)}
                    >
                      <option value="TODOS">Todos los Productos / Insumos</option>
                      {opcionesProductos.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select 
                      className={`form-select form-select-sm ${inputBgClass}`}
                      style={{ color: textColor }}
                      value={filtroHistorialProveedor}
                      onChange={(e) => setFiltroHistorialProveedor(e.target.value)}
                    >
                      <option value="TODOS">Todos los Proveedores</option>
                      {opcionesProveedores.map((prov, idx) => (
                        <option key={idx} value={prov}>{prov}</option>
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
                      className="table align-middle mb-0 small"
                      style={{ 
                        color: textColor,
                        backgroundColor: 'transparent',
                        '--bs-table-bg': 'transparent',
                        '--bs-table-color': textColor,
                        borderColor: cardBorder
                      } as React.CSSProperties}
                    >
                      <thead>
  <tr 
    className="text-uppercase"
    style={{ 
      color: isDark ? '#eab308' : '#854d0e',
      backgroundColor: bgModal, 
      borderBottom: `2px solid ${cardBorder}`
    }}
  >
    <th className="py-2" style={{ backgroundColor: bgModal }}>Fecha</th>
    <th className="py-2" style={{ backgroundColor: bgModal }}>Origen / Ítem</th>
    <th className="py-2" style={{ backgroundColor: bgModal }}>Proveedor</th>
    <th className="py-2 text-center" style={{ backgroundColor: bgModal }}>Cant.</th>
    <th className="py-2" style={{ backgroundColor: bgModal }}>Motivo / Descripción</th>
  </tr>
</thead>
                      <tbody>
                        {historialFiltrado.map((m) => {
                          const esInsumo = !!m.insumo;
                          const provNombre = obtenerNombreProveedor(m);
                          const nombreItem = m.insumo?.nombreInsumo || m.producto?.nombreProducto || 'Desconocido';

                          return (
                            <tr key={m.idMerma || Math.random()} style={{ borderColor: cardBorder }}>
                              <td className="text-nowrap">{m.fechaMerma ? new Date(m.fechaMerma).toLocaleString('es-AR') : '-'}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <span 
  className="px-2 py-1 rounded text-uppercase fw-semibold"
  style={{
    fontSize: '0.65rem',
    lineHeight: 1,
    display: 'inline-block',
    backgroundColor: esInsumo 
      ? (isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe')
      : (isDark ? 'rgba(74, 222, 128, 0.15)' : '#dcfce7'),
    color: esInsumo 
      ? (isDark ? '#38bdf8' : '#0369a1')
      : (isDark ? '#4ade80' : '#15803d'),
    border: `1px solid ${
      esInsumo 
        ? (isDark ? '#0284c7' : '#bae6fd')
        : (isDark ? '#16a34a' : '#86efac')
    }`
  }}
>
  {esInsumo ? 'Insumo' : 'Producto'}
</span>
                                  <span className="fw-bold" style={{ color: textColor }}>
                                    {nombreItem}
                                  </span>
                                </div>
                              </td>
                              <td className="fw-semibold" style={{ color: subTextColor }}>
                                {provNombre || '-'}
                              </td>
                              <td className="text-center fw-bold text-danger text-nowrap">-{m.cantidad}</td>
                              <td style={{ maxWidth: '240px', wordBreak: 'break-word' }}>{m.descripcion}</td>
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
            <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={onClose}>
              Volver
            </button>
            {tabActiva === 'registrar' && (
              <button 
                type="submit" 
                className="btn btn-success fw-bold px-4" 
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Registrar Mermas'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal de Advertencia Personalizado */}
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