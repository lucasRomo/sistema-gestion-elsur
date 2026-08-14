import React, { useState, useEffect } from 'react';
import { mermaService, type MermaEntity } from '../service/mermaService';

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

  // Estado para guardar las recetas de insumos cargadas dinámicamente
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

    // Cargar los insumos vinculados a cada producto del pedido desde la API
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
              mapa[idProd] = data; // Array de ProductoInsumo
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

    // Enviamos tanto id_pedido como idPedido para asegurar el mapeo
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
        <div className="modal-content custom-card" style={{ backgroundColor: '#1a1a1c', border: '2px solid #eab308', borderRadius: '12px', color: '#fff' }}>
          
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold font-monospace" style={{ color: '#eab308' }}>
              <i className="bi bi-exclamation-diamond-fill me-2"></i>Mermas - Pedido #{idPedido}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="px-3 pt-3">
            <div className="btn-group w-100 font-monospace">
              <button 
                className={`btn btn-sm ${tabActiva === 'registrar' ? 'btn-warning fw-bold' : 'btn-outline-warning'}`}
                onClick={() => setTabActiva('registrar')}
              >
                <i className="bi bi-plus-circle me-1"></i>Registrar Merma
              </button>
              <button 
                className={`btn btn-sm ${tabActiva === 'historial' ? 'btn-warning fw-bold' : 'btn-outline-warning'}`}
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
                  
                  // Insumos obtenidos desde la API de producto-insumo
                  const recetaInsumos = recetasMap[idProd] || [];

                  return (
                    <div key={keyProd} className="p-3 rounded border border-secondary" style={{ backgroundColor: '#121214' }}>
                      <div className="form-check d-flex align-items-center gap-2 mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox"
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                          id={keyProd}
                          checked={prodSelected}
                          onChange={() => toggleSelection(keyProd, { idProducto: idProd })}
                        />
                        <label className="form-check-label fw-bold text-white fs-6" htmlFor={keyProd} style={{ cursor: 'pointer' }}>
                          <i className="bi bi-box-seam me-2 text-warning"></i>
                          {prod.nombreProducto || prod.nombre || 'Producto'}
                        </label>
                      </div>

                      {prodSelected && (
                        <div className="ms-4 mb-3 p-2 rounded bg-dark border border-secondary">
                          <div className="row g-2">
                            <div className="col-4">
                              <label className="form-label small text-warning m-0">Cantidad:</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-control form-control-sm bg-black text-white border-secondary"
                                value={selections[keyProd]?.cantidad || 1}
                                onChange={(e) => updateSelectionData(keyProd, 'cantidad', e.target.value)}
                              />
                            </div>
                            <div className="col-8">
                              <label className="form-label small text-warning m-0">Motivo:</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm bg-black text-white border-secondary"
                                placeholder="Ej: Impresión manchada / Mal cortado"
                                value={selections[keyProd]?.descripcion || ''}
                                onChange={(e) => updateSelectionData(keyProd, 'descripcion', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {recetaInsumos.length > 0 && (
                        <div className="ms-4 ps-2 border-start border-warning border-2 mt-2">
                          <span className="small text-muted fw-bold d-block mb-1">Insumos Asociados:</span>
                          {recetaInsumos.map((itemInsumo: any, iIdx: number) => {
                            const ins = itemInsumo.insumo || {};
                            const idIns = ins.idInsumo || ins.id_insumo;
                            const keyIns = `ins-${idProd}-${idIns}-${iIdx}`;
                            const insSelected = !!selections[keyIns]?.selected;

                            return (
                              <div key={keyIns} className="ms-2 mb-2">
                                <div className="form-check d-flex align-items-center gap-2">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox"
                                    id={keyIns}
                                    checked={insSelected}
                                    onChange={() => toggleSelection(keyIns, { idInsumo: idIns })}
                                  />
                                  <label className="form-check-label small text-light" htmlFor={keyIns} style={{ cursor: 'pointer' }}>
                                    <i className="bi bi-layers me-1 text-info"></i>
                                    {ins.nombreInsumo || ins.nombre || 'Insumo'}
                                  </label>
                                </div>

                                {insSelected && (
                                  <div className="ms-4 mt-1 p-2 rounded bg-black border border-secondary">
                                    <div className="row g-2">
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
                                          placeholder="Motivo merma insumo"
                                          value={selections[keyIns]?.descripcion || ''}
                                          onChange={(e) => updateSelectionData(keyIns, 'descripcion', e.target.value)}
                                        />
                                      </div>
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
                    <table className="table table-dark table-hover align-middle small">
                      <thead>
                        <tr className="text-warning">
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Afectado</th>
                          <th>Cant.</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((m) => (
                          <tr key={m.idMerma}>
                            <td>{m.fechaMerma ? new Date(m.fechaMerma).toLocaleString() : '-'}</td>
                            <td>
                              <span className={`badge ${m.producto ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                                {m.producto ? 'Producto' : 'Insumo'}
                              </span>
                            </td>
                            <td className="fw-bold">{m.producto?.nombreProducto || m.insumo?.nombreInsumo || '-'}</td>
                            <td className="text-danger fw-bold">-{m.cantidad}</td>
                            <td>{m.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
              Cerrar
            </button>
            {tabActiva === 'registrar' && (
              <button 
                type="button" 
                className="btn btn-warning fw-bold px-4" 
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