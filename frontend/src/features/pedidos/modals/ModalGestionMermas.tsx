import React, { useState, useEffect } from 'react';
import { mermaService, type MermaEntity } from '../../../services/mermaService';

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
  const [tabActiva, setTabActiva] = useState<'registrar' | 'historial'>('registrar');
  const [historial, setHistorial] = useState<MermaEntity[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

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
      alert('Por favor, selecciona al menos un producto o insumo afectado.');
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
      alert('¡Merma registrada correctamente!');
      setSelections({});
      await cargarHistorialMermas();
      setTabActiva('historial');
      if (onExito) onExito();
    } catch (error: any) {
      alert(error.message || 'Error al guardar la merma');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content custom-card" style={{ backgroundColor: '#18181b', border: '2px solid #eab308', borderRadius: '12px', color: '#fff' }}>
          
          <div className="modal-header border-bottom border-secondary pb-3">
            <h5 className="modal-title fw-bold font-monospace text-warning">
              <i className="bi bi-exclamation-diamond-fill me-2"></i>Mermas - Pedido #{idPedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="px-3 pt-3">
            <div className="btn-group w-100 font-monospace">
              <button 
                className={`btn btn-sm ${tabActiva === 'registrar' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('registrar')}
              >
                <i className="bi bi-plus-circle me-1"></i>Registrar Merma
              </button>
              <button 
                className={`btn btn-sm ${tabActiva === 'historial' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('historial')}
              >
                <i className="bi bi-journal-text me-1"></i>Historial ({historial.length})
              </button>
            </div>
          </div>

          <div className="modal-body font-monospace" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {tabActiva === 'registrar' ? (
              <div className="d-flex flex-column gap-3">
                {pedido.detalles?.map((det: any, idx: number) => {
                  const prod = det.producto || {};
                  const idProd = prod.idProducto || prod.id_producto;
                  const keyProd = `prod-${idProd}-${idx}`;
                  const prodSelected = !!selections[keyProd]?.selected;
                  const recetaInsumos = recetasMap[idProd] || [];

                  return (
                    <div key={keyProd} className="p-3 rounded border border-secondary" style={{ backgroundColor: '#09090b' }}>
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
                          <label className="form-check-label fw-bold text-white fs-6 m-0 cursor-pointer" htmlFor={keyProd}>
                            <i className="bi bi-box-seam me-2 text-warning"></i>
                            {prod.nombreProducto || prod.nombre || 'Producto'}
                          </label>
                        </div>
                        <span className="badge bg-secondary">Pedida: {det.cantidad} unid.</span>
                      </div>

                      {prodSelected && (
                        <div className="ms-4 mb-3 p-3 rounded bg-dark border border-warning">
                          <div className="row g-2">
                            <div className="col-4">
                              <label className="form-label small text-warning m-0 fw-bold">Cantidad Rota / Falla:</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-control form-control-sm bg-black text-white border-secondary"
                                value={selections[keyProd]?.cantidad || 1}
                                onChange={(e) => updateSelectionData(keyProd, 'cantidad', e.target.value)}
                              />
                            </div>
                            <div className="col-8">
                              <label className="form-label small text-warning m-0 fw-bold">Motivo:</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm bg-black text-white border-secondary"
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
                              <div key={keyIns} className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary">
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox"
                                    id={keyIns}
                                    checked={insSelected}
                                    onChange={() => toggleSelection(keyIns, { idInsumo: idIns, idProducto: idProd })}
                                  />
                                  <label className="form-check-label small text-light cursor-pointer m-0" htmlFor={keyIns}>
                                    <i className="bi bi-layers me-1 text-info"></i>
                                    {ins.nombreInsumo || ins.nombre || 'Insumo'}
                                  </label>
                                </div>

                                {insSelected && (
                                  <div className="mt-2 row g-2">
                                    <div className="col-4">
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
                                        placeholder="Cant."
                                        value={selections[keyIns]?.cantidad || 1}
                                        onChange={(e) => updateSelectionData(keyIns, 'cantidad', e.target.value)}
                                      />
                                    </div>
                                    <div className="col-8">
                                      <input 
                                        type="text" 
                                        className="form-control form-control-sm bg-dark text-white border-secondary"
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
              <div>
                {cargandoHistorial ? (
                  <div className="text-center py-4 text-muted">Cargando mermas...</div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-4 text-muted">No hay registros de mermas para este pedido.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle small border-secondary">
                      <thead>
                        <tr className="text-warning">
                          <th>Fecha</th>
                          <th>Origen / Ítem</th>
                          <th className="text-center">Cant.</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((m) => {
                          const esInsumo = Boolean(m.insumo);

                          return (
                            <tr key={m.idMerma}>
                              <td className="text-nowrap">{m.fechaMerma ? new Date(m.fechaMerma).toLocaleString('es-AR') : '-'}</td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  {esInsumo ? (
                                    <>
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-warning text-dark font-monospace">INSUMO</span>
                                        <span className="fw-bold text-white">{m.insumo?.nombreInsumo}</span>
                                      </div>
                                      {m.producto?.nombreProducto && (
                                        <div className="small text-muted ms-1 d-flex align-items-center gap-1">
                                          <i className="bi bi-arrow-return-right text-warning"></i>
                                          <span>De producto:</span>
                                          <span className="text-warning fw-semibold">{m.producto.nombreProducto}</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-primary text-white font-monospace">PRODUCTO</span>
                                      <span className="fw-bold text-info">{m.producto?.nombreProducto || 'Producto'}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="text-center fw-bold text-danger fs-6">-{m.cantidad}</td>
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

          <div className="modal-footer border-top border-secondary pt-2">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Cerrar
            </button>
            {tabActiva === 'registrar' && (
              <button 
                type="button" 
                className="btn btn-warning fw-bold text-dark px-4" 
                disabled={guardando}
                onClick={handleGuardarMerma}
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