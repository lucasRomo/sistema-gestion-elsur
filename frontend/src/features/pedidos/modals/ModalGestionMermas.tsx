import React, { useState, useEffect } from 'react';
import { mermaService, type MermaEntity } from '../../../services/mermaService';
import { useTheme } from '../../../Context/ThemeContext';

interface ModalGestionMermasProps {
  pedido: any;
  onClose: () => void;
  onExito?: () => void;
  onConfirm?: () => void;
}

interface SelectionState {
  [key: string]: {
    selected: boolean;
    cantidad: number;
    descripcion: string;
    idProducto?: number;
    idInsumo?: number;
  };
}

export const ModalGestionMermas: React.FC<ModalGestionMermasProps> = ({ pedido, onClose, onExito }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Paleta de colores adaptativa
  const bgModal = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const cardBg = isDark ? '#18181b' : '#f8fafc';
  const cardBorder = isDark ? '#27272a' : '#e2e8f0';
  const inputBgClass = isDark ? 'bg-dark border-secondary' : 'bg-white border-secondary-subtle';
  const inputInnerBgClass = isDark ? 'bg-black border-secondary' : 'bg-white border-secondary-subtle';
  const tableHeaderBg = isDark ? '#27272a' : '#f1f5f9';

  const [tabActiva, setTabActiva] = useState<'registrar' | 'historial'>('registrar');
  const [historial, setHistorial] = useState<MermaEntity[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Modal de Alerta / Advertencia
  const [mostrarAlerta, setMostrarAlerta] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  const [recetasMap, setRecetasMap] = useState<{ [idProducto: number]: any[] }>({});
  const [selections, setSelections] = useState<SelectionState>({});
  const idPedido = pedido.id_pedido || pedido.idPedido;

  const cargarHistorialMermas = async () => {
    setCargandoHistorial(true);
    try {
      const data = await mermaService.obtenerPorPedido(idPedido);
      setHistorial(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorialMermas();

    const cargarRecetas = async () => {
      if (!pedido.detalles) return;
      const mapa: { [idProducto: number]: any[] } = {};

      for (const det of pedido.detalles) {
        const prod = det.producto || {};
        const idProd = prod.idProducto || prod.id_producto;

        if (idProd && !mapa[idProd]) {
          try {
            const res = await fetch(`http://localhost:8080/api/producto-insumo/producto/${idProd}`);
            if (res.ok) {
              const data = await res.json();
              mapa[idProd] = data;
            }
          } catch (e) {
            console.error(`Error al cargar receta del producto ${idProd}:`, e);
          }
        }
      }
      setRecetasMap(mapa);
    };

    cargarRecetas();
  }, [idPedido]);

  const toggleSelection = (key: string, defaultData: { idProducto?: number; idInsumo?: number }) => {
    setSelections(prev => {
      const current = prev[key];
      if (current?.selected) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      } else {
        return {
          ...prev,
          [key]: {
            selected: true,
            cantidad: 1,
            descripcion: '',
            ...defaultData
          }
        };
      }
    });
  };

  const updateSelectionData = (key: string, field: 'cantidad' | 'descripcion', value: any) => {
    setSelections(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleGuardarMerma = async () => {
    const keys = Object.keys(selections);
    if (keys.length === 0) {
      setMensajeAlerta('Por favor, selecciona al menos un producto o insumo afectado.');
      setMostrarAlerta(true);
      return;
    }

    const userLogueado = JSON.parse(localStorage.getItem('usuario_logueado') || '{}');
    const idUsuario = userLogueado.idUsuario ?? userLogueado.id_usuario ?? userLogueado.id ?? 1;

    const mermasPayload: any[] = keys.map(k => ({
      pedido: { id_pedido: idPedido, idPedido: idPedido },
      idUsuario,
      cantidad: Number(selections[k].cantidad) || 1,
      descripcion: selections[k].descripcion || 'Merma registrada en el pedido',
      producto: selections[k].idProducto ? { idProducto: selections[k].idProducto, id_producto: selections[k].idProducto } : null,
      insumo: selections[k].idInsumo ? { idInsumo: selections[k].idInsumo, id_insumo: selections[k].idInsumo } : null
    }));

    setGuardando(true);
    try {
      await mermaService.registrarMermas(mermasPayload);
      setSelections({});
      await cargarHistorialMermas();
      setTabActiva('historial');
      if (onExito) onExito();
    } catch (error: any) {
      setMensajeAlerta(error.message || 'Error al guardar la merma');
      setMostrarAlerta(true);
    } finally {
      setGuardando(false);
    }
  };

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
              <i className="bi bi-exclamation-diamond-fill me-2 fs-4"></i>
              Mermas - Pedido #{idPedido}
            </h5>
            <button 
              type="button" 
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`} 
              onClick={onClose}
            ></button>
          </div>

          {/* Navegación Pestañas */}
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
                <i className="bi bi-journal-text me-1"></i> Historial ({historial.length})
              </button>
            </div>
          </div>

          {/* Cuerpo del Modal */}
          <div className="modal-body my-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {tabActiva === 'registrar' ? (
              <div className="d-flex flex-column gap-3">
                {pedido.detalles?.map((det: any, idx: number) => {
                  const prod = det.producto || {};
                  const idProd = prod.idProducto || prod.id_producto;
                  const keyProd = `prod-${idProd}-${idx}`;
                  const prodSelected = !!selections[keyProd]?.selected;
                  const recetaInsumos = recetasMap[idProd] || [];

                  return (
                    <div 
                      key={keyProd} 
                      className="p-3 rounded border" 
                      style={{ 
                        backgroundColor: cardBg, 
                        borderColor: cardBorder 
                      }}
                    >
                      {/* Cabecera Producto */}
                      <div className="form-check d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            className="form-check-input" 
                            type="checkbox"
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            id={keyProd}
                            checked={prodSelected}
                            onChange={() => toggleSelection(keyProd, { idProducto: idProd })}
                          />
                          <label className="form-check-label fw-bold fs-6 m-0 cursor-pointer" style={{ color: textColor }} htmlFor={keyProd}>
                            <i className="bi bi-box-seam me-2 text-warning"></i>
                            {prod.nombreProducto || prod.nombre || 'Producto'}
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
                          Pedida: {det.cantidad} unid.
                        </span>
                      </div>

                      {/* Desplegable formulario Producto Seleccionado */}
                      {prodSelected && (
                        <div 
                          className="ms-4 mb-3 p-3 rounded border"
                          style={{ 
                            backgroundColor: isDark ? '#18181b' : '#fefce8', 
                            borderColor: '#eab308' 
                          }}
                        >
                          <div className="row g-2">
                            <div className="col-4">
                              <label className="form-label small text-warning m-0 fw-bold">Cantidad Rota / Falla:</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                className={`form-control form-control-sm ${inputInnerBgClass}`}
                                style={{ color: textColor }}
                                value={selections[keyProd]?.cantidad || 1}
                                onChange={(e) => updateSelectionData(keyProd, 'cantidad', e.target.value)}
                              />
                            </div>
                            <div className="col-8">
                              <label className="form-label small text-warning m-0 fw-bold">Motivo:</label>
                              <input 
                                type="text" 
                                className={`form-control form-control-sm ${inputInnerBgClass}`}
                                style={{ color: textColor }}
                                placeholder="Ej: Mal cortado / Impresión manchada"
                                value={selections[keyProd]?.descripcion || ''}
                                onChange={(e) => updateSelectionData(keyProd, 'descripcion', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Insumos del producto */}
                      {recetaInsumos.length > 0 && (
                        <div className="ms-4 ps-3 border-start border-warning border-2 mt-3">
                          <span className="small text-warning fw-bold d-block mb-2">
                            <i className="bi bi-diagram-3 me-1"></i> Insumos que componen este producto:
                          </span>
                          {recetaInsumos.map((itemInsumo: any, iIdx: number) => {
                            const ins = itemInsumo.insumo || {};
                            const idIns = ins.idInsumo || ins.id_insumo;
                            const keyIns = `ins-${idProd}-${idIns}-${iIdx}`;
                            const insSelected = !!selections[keyIns]?.selected;

                            return (
                              <div 
                                key={keyIns} 
                                className="mb-2 p-2 rounded border"
                                style={{ 
                                  backgroundColor: isDark ? '#121214' : '#ffffff',
                                  borderColor: cardBorder
                                }}
                              >
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox"
                                    id={keyIns}
                                    checked={insSelected}
                                    onChange={() => toggleSelection(keyIns, { idInsumo: idIns, idProducto: idProd })}
                                  />
                                  <label className="form-check-label small cursor-pointer m-0 fw-semibold" style={{ color: textColor }} htmlFor={keyIns}>
                                    <i className="bi bi-layers me-1" style={{ color: isDark ? '#38bdf8' : '#0284c7' }}></i>
                                    {ins.nombreInsumo || ins.nombre || 'Insumo'}
                                  </label>
                                </div>

                                {insSelected && (
                                  <div className="mt-2 row g-2">
                                    <div className="col-4">
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        className={`form-control form-control-sm ${inputInnerBgClass}`}
                                        style={{ color: textColor }}
                                        placeholder="Cant."
                                        value={selections[keyIns]?.cantidad || 1}
                                        onChange={(e) => updateSelectionData(keyIns, 'cantidad', e.target.value)}
                                      />
                                    </div>
                                    <div className="col-8">
                                      <input 
                                        type="text" 
                                        className={`form-control form-control-sm ${inputInnerBgClass}`}
                                        style={{ color: textColor }}
                                        placeholder={`Motivo fallo insumo en ${prod.nombreProducto || 'producto'}`}
                                        value={selections[keyIns]?.descripcion || ''}
                                        onChange={(e) => updateSelectionData(keyIns, 'descripcion', e.target.value)}
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
            ) : (
              /* TAB HISTORIAL */
              <div>
                {cargandoHistorial ? (
                  <div className="text-center py-4 text-muted">Cargando mermas...</div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-4 text-muted">No hay registros de mermas para este pedido.</div>
                ) : (
                  <div className="table-responsive">
                    <table 
                      className="table align-middle m-0 small"
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
                            backgroundColor: tableHeaderBg,
                            borderBottom: `2px solid ${cardBorder}`
                          }}
                        >
                          <th className="py-2">Fecha</th>
                          <th className="py-2">Origen / Ítem</th>
                          <th className="py-2 text-center">Cant.</th>
                          <th className="py-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((m) => {
                          const esInsumo = Boolean(m.insumo);

                          return (
                            <tr key={m.idMerma || Math.random()} style={{ borderColor: cardBorder }}>
                              <td className="text-nowrap" style={{ color: textColor }}>
                                {m.fechaMerma ? new Date(m.fechaMerma).toLocaleString('es-AR') : '-'}
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  {esInsumo ? (
                                    <>
                                      <div className="d-flex align-items-center gap-2">
                                        <span 
                                          className="px-2 py-0.5 rounded small fw-semibold"
                                          style={{
                                            fontSize: '0.7rem',
                                            backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef3c7',
                                            color: isDark ? '#fde047' : '#b45309',
                                            border: `1px solid ${isDark ? '#ca8a04' : '#fcd34d'}`
                                          }}
                                        >
                                          INSUMO
                                        </span>
                                        <span className="fw-bold" style={{ color: textColor }}>
                                          {m.insumo?.nombreInsumo}
                                        </span>
                                      </div>
                                      {m.producto?.nombreProducto && (
                                        <div className="small ms-1 d-flex align-items-center gap-1" style={{ color: subTextColor, fontSize: '0.8rem' }}>
                                          <i className="bi bi-arrow-return-right text-warning"></i>
                                          <span>De producto:</span>
                                          <span className="fw-semibold" style={{ color: isDark ? '#fde047' : '#d97706' }}>
                                            {m.producto.nombreProducto}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="d-flex align-items-center gap-2">
                                      <span 
                                        className="px-2 py-0.5 rounded small fw-semibold"
                                        style={{
                                          fontSize: '0.7rem',
                                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                                          color: isDark ? '#60a5fa' : '#1d4ed8',
                                          border: `1px solid ${isDark ? '#2563eb' : '#93c5fd'}`
                                        }}
                                      >
                                        PRODUCTO
                                      </span>
                                      <span className="fw-bold" style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                                        {m.producto?.nombreProducto || 'Producto'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="text-center fw-bold text-danger fs-6">-{m.cantidad}</td>
                              <td style={{ maxWidth: '250px', wordBreak: 'break-word', color: subTextColor }}>
                                {m.descripcion}
                              </td>
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
              Cerrar
            </button>
            {tabActiva === 'registrar' && (
              <button 
                type="button" 
                className="btn btn-success fw-bold px-4" 
                disabled={guardando}
                onClick={handleGuardarMerma}
              >
                {guardando ? 'Guardando...' : 'Registrar Mermas'}
              </button>
            )}
          </div>

        </div>
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