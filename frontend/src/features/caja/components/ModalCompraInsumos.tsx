import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import { getInsumos } from '../../insumos/services/insumoService';
import type { Proveedor } from '../../proveedores/types/Proveedor';

export interface ItemCompraInsumo {
  idInsumo?: number;
  esNuevoInsumo: boolean;
  nombreInsumo: string;
  cantidadEmpaquetada: number;
  precioUnitario: number;
  subtotal: number;
  factorConversion?: number;
  idUnidad?: number;
  idUnidadCompra?: number;
}

export interface DatosCompraInsumo {
  montoTotal: number;
  metodoPago: string;
  concepto: string;
  idUsuario?: number;
  idProveedor?: number;
  items: ItemCompraInsumo[];
  comprobanteImagen?: string | null;
}

interface ModalCompraInsumosProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (datos: DatosCompraInsumo) => Promise<void>;
}

export const ModalCompraInsumos: React.FC<ModalCompraInsumosProps> = ({
  isOpen,
  onClose,
  onConfirmar
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? 'text-white' : 'text-dark';
  const cardBg = isDark ? '#18181b' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#cbd5e1';
  const inputBg = isDark ? '#222122' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  const [insumos, setInsumos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemsCompra, setItemsCompra] = useState<ItemCompraInsumo[]>([]);

  const [esNuevoInsumo, setEsNuevoInsumo] = useState(false);
  const [idInsumoSel, setIdInsumoSel] = useState<string>('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [factorConversion, setFactorConversion] = useState<number>(1);
  const [idUnidad, setIdUnidad] = useState<string>('');
  const [idUnidadCompra, setIdUnidadCompra] = useState<string>('');

  const [idProveedorSel, setIdProveedorSel] = useState<string>('');
  const [montoTotalGlobal, setMontoTotalGlobal] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [modificadoManualmente, setModificadoManualmente] = useState(false);

  // Estados para manejo del comprobante
  const [comprobanteImagen, setComprobanteImagen] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      cargarInsumos();
      cargarProveedores();
      cargarUnidades();
      resetFormCompleto();
    }
  }, [isOpen]);

  const cargarInsumos = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data.filter((i: any) => i.estado === 'Activo'));
    } catch (error) {
      console.error('Error al cargar insumos:', error);
    }
  };

  const cargarProveedores = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/proveedores');
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const cargarUnidades = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/unidades-medida');
      if (response.ok) {
        const data = await response.json();
        setUnidadesMedida(data);
      }
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
    }
  };

  const resetFormCompleto = () => {
    setItemsCompra([]);
    resetFormItem();
    setIdProveedorSel('');
    setMontoTotalGlobal(0);
    setMetodoPago('EFECTIVO');
    setObservaciones('');
    setModificadoManualmente(false);
    setComprobanteImagen(null);
    setNombreArchivo('');
  };

  const resetFormItem = () => {
    setEsNuevoInsumo(false);
    setIdInsumoSel('');
    setNombreNuevo('');
    setCantidad(1);
    setPrecioUnitario(0);
    setFactorConversion(1);
    setIdUnidad('');
    setIdUnidadCompra('');
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobanteImagen(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectInsumo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setIdInsumoSel(val);
    const ins = insumos.find((i: any) => String(i.idInsumo || i.id) === String(val));
    if (ins) {
      setPrecioUnitario(ins.precio || 0);
      setFactorConversion(ins.factorConversion || 1);
    }
  };

  const handleAgregarItem = () => {
    if (!esNuevoInsumo && !idInsumoSel) {
      alert('Debe seleccionar un insumo existente.');
      return;
    }
    if (esNuevoInsumo && !nombreNuevo.trim()) {
      alert('Debe ingresar el nombre del nuevo insumo.');
      return;
    }
    if (cantidad <= 0 || precioUnitario < 0) {
      alert('Cantidad debe ser mayor a 0 y precio no puede ser negativo.');
      return;
    }
    if (esNuevoInsumo && factorConversion <= 0) {
      alert('El factor de conversión debe ser mayor a 0.');
      return;
    }

    const insumoNombre = esNuevoInsumo 
      ? nombreNuevo.trim() 
      : insumos.find((i: any) => String(i.idInsumo || i.id) === String(idInsumoSel))?.nombreInsumo || '';

    const subtotal = Number((cantidad * precioUnitario).toFixed(2));

    const nuevoItem: ItemCompraInsumo = {
      idInsumo: esNuevoInsumo ? undefined : Number(idInsumoSel),
      esNuevoInsumo,
      nombreInsumo: insumoNombre,
      cantidadEmpaquetada: cantidad,
      precioUnitario,
      subtotal,
      factorConversion,
      idUnidad: idUnidad ? Number(idUnidad) : undefined,
      idUnidadCompra: idUnidadCompra ? Number(idUnidadCompra) : undefined
    };

    const nuevaLista = [...itemsCompra, nuevoItem];
    setItemsCompra(nuevaLista);

    if (!modificadoManualmente) {
      const nuevoTotal = nuevaLista.reduce((acc, item) => acc + item.subtotal, 0);
      setMontoTotalGlobal(Number(nuevoTotal.toFixed(2)));
    }

    resetFormItem();
  };

  const handleEliminarItem = (index: number) => {
    const nuevaLista = itemsCompra.filter((_, i) => i !== index);
    setItemsCompra(nuevaLista);

    if (!modificadoManualmente) {
      const nuevoTotal = nuevaLista.reduce((acc, item) => acc + item.subtotal, 0);
      setMontoTotalGlobal(Number(nuevoTotal.toFixed(2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsCompra.length === 0) {
      alert('Debe agregar al menos un insumo a la lista de compra.');
      return;
    }

    if (montoTotalGlobal <= 0) {
      alert('El monto total debe ser mayor a 0.');
      return;
    }

    setLoading(true);
    try {
      const resumenInsumos = itemsCompra.map(i => `${i.nombreInsumo} (x${i.cantidadEmpaquetada})`).join(', ');
      
      const provSeleccionado = proveedores.find(p => String(p.idProveedor) === idProveedorSel);
      const textoProveedor = provSeleccionado ? ` - Prov: ${provSeleccionado.nombreComercial}` : '';

      await onConfirmar({
        montoTotal: montoTotalGlobal,
        metodoPago,
        concepto: `Compra de Insumos: ${resumenInsumos}${textoProveedor}${observaciones ? ` - ${observaciones}` : ''}`,
        idProveedor: idProveedorSel ? Number(idProveedorSel) : undefined,
        items: itemsCompra,
        comprobanteImagen: metodoPago === 'TRANSFERENCIA' ? comprobanteImagen : null
      });

      onClose();
    } catch (error: any) {
      alert('Error procesando la compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className={`modal-content font-monospace ${textColor}`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
          
          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold text-info">
              <i className="bi bi-truck me-2"></i>Compra de Insumos (Múltiples Items)
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-4">
              
              <div className="p-3 rounded mb-4" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}` }}>
                <h6 className="fw-bold text-info mb-3">Agregar Insumo a la Compra</h6>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold small">Origen del Insumo:</span>
                  <div className="btn-group">
                    <button
                      type="button"
                      className={`btn btn-sm ${!esNuevoInsumo ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setEsNuevoInsumo(false)}
                    >
                      Insumo Existente
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${esNuevoInsumo ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setEsNuevoInsumo(true)}
                    >
                      + Nuevo Insumo
                    </button>
                  </div>
                </div>

                {!esNuevoInsumo ? (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Seleccionar Insumo Existente</label>
                    <select
                      className="form-select font-monospace"
                      style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                      value={idInsumoSel}
                      onChange={handleSelectInsumo}
                    >
                      <option value="">-- Seleccione un Insumo --</option>
                      {insumos.map((i: any) => {
                        const idVal = i.idInsumo || i.id;
                        return (
                          <option key={idVal} value={idVal}>
                            {i.nombreInsumo} (Stock Bultos: {i.stockEmpaquetado || 0}) - ${i.precio}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Nombre del Nuevo Insumo</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                        placeholder="Ej. Resma A4 75gr Chamex"
                        value={nombreNuevo}
                        onChange={(e) => setNombreNuevo(e.target.value)}
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Unidad Suelta (Consumo)</label>
                        <select
                          className="form-select font-monospace"
                          style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                          value={idUnidad}
                          onChange={(e) => setIdUnidad(e.target.value)}
                        >
                          <option value="">Ej. Hoja / ml / Unidad</option>
                          {unidadesMedida.map((u: any) => (
                            <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Unidad Empaque (Compra)</label>
                        <select
                          className="form-select font-monospace"
                          style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                          value={idUnidadCompra}
                          onChange={(e) => setIdUnidadCompra(e.target.value)}
                        >
                          <option value="">Ej. Resma / Caja / Bulto</option>
                          {unidadesMedida.map((u: any) => (
                            <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Factor Conversión</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control font-monospace"
                          style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                          placeholder="Ej. 500"
                          value={factorConversion}
                          onChange={(e) => setFactorConversion(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Cant. Empaques</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control font-monospace"
                      style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Precio Unit. Bulto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control font-monospace"
                      style={{ backgroundColor: cardBg, color: textColor, borderColor: inputBorder }}
                      value={precioUnitario}
                      onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                    />
                  </div>

                  <div className="col-md-4 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary w-100 fw-semibold"
                      onClick={handleAgregarItem}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Añadir a la Lista
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold mb-2">Detalle de la Compra ({itemsCompra.length} items)</h6>
                <div className="table-responsive rounded border border-secondary" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className={`table table-sm table-hover align-middle m-0 ${isDark ? 'table-dark' : ''}`}>
                    <thead>
                      <tr className="text-muted">
                        <th>#</th>
                        <th>Insumo</th>
                        <th>Tipo</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-end">P. Unit</th>
                        <th className="text-end">Subtotal</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCompra.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-3 opacity-50">
                            No hay insumos añadidos a esta compra
                          </td>
                        </tr>
                      ) : (
                        itemsCompra.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item.nombreInsumo}</td>
                            <td>
                              <span className={`badge ${item.esNuevoInsumo ? 'bg-success' : 'bg-info'}`}>
                                {item.esNuevoInsumo ? 'Nuevo' : 'Existente'}
                              </span>
                            </td>
                            <td className="text-center">{item.cantidadEmpaquetada}</td>
                            <td className="text-end">${item.precioUnitario.toFixed(2)}</td>
                            <td className="text-end fw-bold">${item.subtotal.toFixed(2)}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                onClick={() => handleEliminarItem(idx)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Proveedor</label>
                  <select
                    className="form-select font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={idProveedorSel}
                    onChange={(e) => setIdProveedorSel(e.target.value)}
                  >
                    <option value="">-- No especificado --</option>
                    {proveedores.map((p) => (
                      <option key={p.idProveedor} value={p.idProveedor}>
                        {p.nombreComercial}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Método de Pago</label>
                  <select
                    className="form-select font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={metodoPago}
                    onChange={(e) => {
                      setMetodoPago(e.target.value);
                      if (e.target.value !== 'TRANSFERENCIA') {
                        setComprobanteImagen(null);
                        setNombreArchivo('');
                      }
                    }}
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="DEBITO">Débito</option>
                    <option value="CREDITO">Crédito</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Observaciones</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Ej. Factura A - Nro 0001"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-warning">
                    Total ($) {modificadoManualmente && '(Manual)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control font-monospace fw-bold text-danger"
                    style={{ backgroundColor: inputBg, borderColor: inputBorder, fontSize: '1.2rem' }}
                    value={montoTotalGlobal}
                    onChange={(e) => {
                      setMontoTotalGlobal(Number(e.target.value));
                      setModificadoManualmente(true);
                    }}
                    required
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer con botón/tarjeta a la izquierda de Cancelar y Confirmar */}
            <div className="modal-footer border-top border-secondary d-flex justify-content-between align-items-center">
              <div>
                {metodoPago === 'TRANSFERENCIA' && (
                  !comprobanteImagen ? (
                    <label 
                      className="btn btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-2 m-0 shadow-sm" 
                      style={{ 
                        backgroundColor: isDark ? '#1a1a1c' : '#f8fafc', 
                        border: `1px solid ${isDark ? '#38bdf8' : '#0284c7'}`, 
                        color: isDark ? '#38bdf8' : '#0284c7', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-6"></i>
                      <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                        Vincular Comprobante
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImagenChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  ) : (
                    <div 
                      className="d-flex align-items-center gap-2 p-1 px-2 rounded shadow-sm" 
                      style={{ 
                        backgroundColor: isDark ? '#121214' : '#f1f5f9', 
                        border: `1px solid ${cardBorder}` 
                      }}
                    >
                      <i className="bi bi-file-earmark-image text-primary fs-6"></i>
                      <span className="small text-truncate" style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                        {nombreArchivo || 'comprobante.png'}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger border-0 p-1 d-flex align-items-center" 
                        onClick={() => {
                          setComprobanteImagen(null);
                          setNombreArchivo('');
                        }}
                        title="Quitar comprobante"
                      >
                        <i className="bi bi-trash-fill fs-6"></i>
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-purple px-4 text-white fw-bold" style={{ backgroundColor: '#6f42c1' }} disabled={loading}>
                  {loading ? 'Procesando...' : 'Confirmar Compra'}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};