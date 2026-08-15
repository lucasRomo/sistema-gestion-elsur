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

  const [tabActiva, setTabActiva] = useState<'registrar' | 'historial'>('registrar');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selections, setSelections] = useState<SelectionState>({});
  const [historial, setHistorial] = useState<MermaEntity[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

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

  const handleGuardarMermas = async () => {
    const ids = Object.keys(selections).map(Number);
    if (ids.length === 0) {
      alert('Por favor, selecciona al menos un insumo para registrar la merma.');
      return;
    }

    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuario = userLogueado.idUsuario ?? userLogueado.id_usuario ?? 1;

    const payload: any[] = ids.map(idInsumo => ({
      idUsuario,
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
      alert(err.message || 'Error al guardar la merma');
    } finally {
      setGuardando(false);
    }
  };

  // Helper para resolver el nombre del proveedor desde la merma o la lista de insumos
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

  // Opciones únicas de Productos e Insumos
  const opcionesProductos = Array.from(
    new Set(
      historial
        .map(m => m.producto?.nombreProducto || m.insumo?.nombreInsumo)
        .filter(Boolean) as string[]
    )
  );

  // Opciones únicas de Proveedores
  const opcionesProveedores = Array.from(
    new Set(
      historial
        .map(m => obtenerNombreProveedor(m))
        .filter(Boolean)
    )
  );

  // Filtrado dinámico del historial (Nombre, Producto/Insumo y Proveedor)
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
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div 
          className="modal-content font-monospace shadow-lg" 
          style={{ 
            backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
            border: '2px solid #eab308', 
            borderRadius: '16px',
            color: isDark ? '#ffffff' : '#0f172a'
          }}
        >
          {/* Header */}
          <div className="modal-header border-bottom border-secondary pb-3">
            <h5 className="modal-title fw-bold text-warning d-flex align-items-center">
              <i className="bi bi-exclamation-diamond-fill me-2 fs-4"></i>
              Gestión de Mermas
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
                className={`btn btn-sm ${tabActiva === 'registrar' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('registrar')}
              >
                <i className="bi bi-plus-circle me-1"></i> Registrar Merma
              </button>
              <button 
                className={`btn btn-sm ${tabActiva === 'historial' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('historial')}
              >
                <i className="bi bi-journal-text me-1"></i> Historial de Mermas ({historialFiltrado.length})
              </button>
            </div>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body my-2" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {tabActiva === 'registrar' ? (
              <div>
                <div className="position-relative mb-3">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-warning"></i>
                  <input 
                    type="text"
                    className={`form-control ps-5 ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
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
                          className={`p-3 rounded border ${selected ? 'border-warning' : 'border-secondary'}`}
                          style={{ backgroundColor: isDark ? '#121214' : '#f8fafc' }}
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
                              <label className="form-check-label fw-bold cursor-pointer m-0" htmlFor={`insumo-merma-${idIns}`}>
                                {insumo.nombreInsumo}
                              </label>
                            </div>
                            <span className="badge bg-secondary">
                              Stock Actual: {insumo.stockActual} {uni}
                            </span>
                          </div>

                          {selected && (
                            <div className="mt-3 pt-2 border-top border-secondary row g-2">
                              <div className="col-md-4">
                                <label className="form-label small text-warning m-0 fw-bold">Cantidad Pérdida:</label>
                                <div className="input-group input-group-sm">
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    min="0.01"
                                    className={`form-control ${isDark ? 'bg-black text-white border-secondary' : ''}`}
                                    value={selections[idIns]?.cantidad ?? ''}
                                    onChange={(e) => updateSelection(idIns, 'cantidad', e.target.value)}
                                  />
                                  <span className="input-group-text bg-secondary text-white">{uni}</span>
                                </div>
                              </div>
                              <div className="col-md-8">
                                <label className="form-label small text-warning m-0 fw-bold">Motivo / Descripción:</label>
                                <input 
                                  type="text" 
                                  className={`form-control form-control-sm ${isDark ? 'bg-black text-white border-secondary' : ''}`}
                                  placeholder="Ej: Material roto, vencido, tirado..."
                                  value={selections[idIns]?.descripcion || ''}
                                  onChange={(e) => updateSelection(idIns, 'descripcion', e.target.value)}
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
                {/* FILTROS DE HISTORIAL (Busqueda + Productos + Proveedores) */}
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <div className="position-relative">
                      <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-warning"></i>
                      <input 
                        type="text"
                        className={`form-control form-control-sm ps-5 ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
                        placeholder="Buscar por nombre..."
                        value={filtroHistorialNombre}
                        onChange={(e) => setFiltroHistorialNombre(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <select 
                      className={`form-select form-select-sm ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
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
                      className={`form-select form-select-sm ${isDark ? 'bg-dark text-white border-secondary' : ''}`}
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
                    <table className={`table ${isDark ? 'table-dark' : 'table-striped'} align-middle small`}>
                      <thead>
                        <tr className="text-warning text-uppercase">
                          <th>Fecha</th>
                          <th>Ítem</th>
                          <th>Proveedor</th>
                          <th className="text-center">Cantidad</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialFiltrado.map((m) => {
                          const provNombre = obtenerNombreProveedor(m);
                          return (
                            <tr key={m.idMerma || Math.random()}>
                              <td>{m.fechaMerma ? new Date(m.fechaMerma).toLocaleString('es-AR') : '-'}</td>
                              <td className="fw-bold text-info">
                                {m.insumo?.nombreInsumo || m.producto?.nombreProducto || 'Merma'}
                              </td>
                              <td className="text-secondary fw-semibold">
                                {provNombre || '-'}
                              </td>
                              <td className="text-center fw-bold text-danger">-{m.cantidad}</td>
                              <td>{m.descripcion}</td>
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
          <div className="modal-footer border-top border-secondary pt-2">
            <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={onClose}>
              Cerrar
            </button>
            {tabActiva === 'registrar' && (
              <button 
                type="button" 
                className="btn btn-warning fw-bold text-dark px-4" 
                disabled={guardando}
                onClick={handleGuardarMermas}
              >
                {guardando ? 'Guardando...' : 'Registrar Mermas'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};