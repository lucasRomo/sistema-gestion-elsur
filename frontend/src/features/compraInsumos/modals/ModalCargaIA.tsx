import React, { useState } from 'react';
import type { ItemCompraInsumo } from '../types/compraInsumos';
import { apiFetch } from '../../../config/api';

interface ModalCargaIAProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmarItems: (nuevosItems: ItemCompraInsumo[]) => void;
  insumos: any[];
  productos: any[];
  unidadesMedida: any[];
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textColor: string;
}

export const ModalCargaIA: React.FC<ModalCargaIAProps> = ({
  isOpen,
  onClose,
  onConfirmarItems,
  insumos,
  productos,
  unidadesMedida,
  isDark,
  cardBg,
  cardBorder,
  textColor
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemsDetectados, setItemsDetectados] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [avisoMsg, setAvisoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validarYCorregirItems = (items: any[]): { items: any[]; avisos: string[] } => {
    const avisos: string[] = [];
    const corregidos = items.map((item) => {
      if (!item.encontradoEnBd) {
        avisos.push(`"${item.descripcion}": ${item.advertencia || 'No se encontró en la BD'}`);
      }
      return item;
    });

    return { items: corregidos, avisos };
  };

  const calcularSubtotal = (item: any): number => {
    if (item.precioTotalDetectado !== null && item.precioTotalDetectado !== undefined) {
      return Number(item.precioTotalDetectado);
    }
    return Number(item.cantidad) * Number(item.precioUnitario);
  };

  const handleProcessImage = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);
    setAvisoMsg(null);

    const catalogos = {
      insumos: insumos.map(i => ({ id: i.idInsumo || i.id, nombre: i.nombreInsumo })),
      productos: productos.map(p => ({ id: p.idProducto, nombre: p.nombreProducto }))
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('catalogos', JSON.stringify(catalogos));

    try {
      const res = await apiFetch('http://localhost:8080/api/ia/analizar-comprobante', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la imagen en el servidor');
      }

      const { items: itemsCorregidos, avisos } = validarYCorregirItems(data.items || []);

      // Mantiene máximo 3 decimales en el precio unitario traído de la IA
      const itemsConPrecioRedondeado = itemsCorregidos.map((item: any) => ({
        ...item,
        precioUnitario: item.precioUnitario ? Number(Number(item.precioUnitario).toFixed(3)) : 0
      }));

      setItemsDetectados(itemsConPrecioRedondeado);

      if (avisos.length > 0) {
        setAvisoMsg(
          `Atención: Hay ítems que no se encontraron en la Base de Datos. Revisa las advertencias antes de confirmar.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarItemDetectado = (idx: number) => {
    setItemsDetectados(itemsDetectados.filter((_, i) => i !== idx));
  };

  const handleConfirmar = () => {
    const itemsValidos = itemsDetectados.filter(i => i.encontradoEnBd);

    if (itemsValidos.length === 0) {
      setErrorMsg('No hay ítems válidos matcheados con la Base de Datos para agregar.');
      return;
    }

    const defaultUnidad = unidadesMedida.length > 0 ? unidadesMedida[0].idUnidad : undefined;

    const itemsProcesados: ItemCompraInsumo[] = itemsValidos.map(item => {
      const cant = Number(item.cantidad) || 1;
      const prec = Number(item.precioUnitario) || 0;
      const subtotal = Number(calcularSubtotal(item).toFixed(2));

      return {
        tipoItem: item.tipoItem as 'INSUMO' | 'PRODUCTO',
        idInsumo: item.idInsumo ? Number(item.idInsumo) : undefined,
        idProducto: item.idProducto ? Number(item.idProducto) : undefined,
        esNuevoInsumo: false,
        nombreInsumo: item.descripcion,
        cantidadEmpaquetada: cant,
        precioUnitario: prec,
        subtotal,
        factorConversion: 1,
        idUnidad: defaultUnidad,
        idUnidadCompra: defaultUnidad
      };
    });

    onConfirmarItems(itemsProcesados);
    onClose();
  };

  return (
    <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1090 }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>

          <div className="modal-header border-bottom border-secondary">
            <h5 className="modal-title fw-bold text-info d-flex align-items-center gap-2">
              <i className="bi bi-magic"></i> Carga Inteligente con IA (Gemini)
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>

          <div className="modal-body py-4">
            {errorMsg && (
              <div className="alert alert-danger font-monospace mb-3">{errorMsg}</div>
            )}

            {avisoMsg && (
              <div className="alert alert-warning font-monospace mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {avisoMsg}
              </div>
            )}

            {itemsDetectados.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-file-earmark-code fs-1 text-info mb-3 d-block"></i>
                <p className="mb-3 opacity-75">Sube una foto del remito, factura o lista de compras para detectar los productos e insumos existentes.</p>
                <div className="col-md-6 mx-auto">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control font-monospace mb-3"
                    style={{ backgroundColor: isDark ? '#222122' : '#fff', color: textColor, borderColor: cardBorder }}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    className="btn btn-primary px-4 fw-bold w-100"
                    disabled={!file || loading}
                    onClick={handleProcessImage}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Analizando comprobante con Gemini...
                      </>
                    ) : (
                      'Escanear Comprobante'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold m-0">Ítems Detectados ({itemsDetectados.length}) — Revisa la coincidencia con la Base de Datos:</h6>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => { setItemsDetectados([]); setAvisoMsg(null); }}>
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Subir otra foto
                  </button>
                </div>

                <div className="table-responsive rounded border border-secondary">
                  <table className={`table table-sm table-hover align-middle m-0 ${isDark ? 'table-dark' : ''}`}>
                    <thead>
                      <tr className="text-muted">
                        <th>Categoría</th>
                        <th>Estado BD</th>
                        <th>Descripción / Nombre</th>
                        <th style={{ width: '110px' }}>Cant.</th>
                        <th style={{ width: '130px' }}>P. Unit ($)</th>
                        <th className="text-end">Subtotal ($)</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsDetectados.map((item, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            backgroundColor: !item.encontradoEnBd ? 'rgba(220, 53, 69, 0.22)' : 'transparent' 
                          }}
                        >
                          <td style={{ backgroundColor: 'inherit' }}>
                            <span className={`badge ${item.tipoItem === 'PRODUCTO' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                              {item.tipoItem}
                            </span>
                          </td>
                          <td style={{ backgroundColor: 'inherit' }}>
                            <span className={`badge ${item.encontradoEnBd ? 'bg-success' : 'bg-danger'}`}>
                              {item.encontradoEnBd ? 'Existe en BD' : 'No encontrado'}
                            </span>
                          </td>
                          <td style={{ backgroundColor: 'inherit' }}>
                            <div>
                              <input
                                type="text"
                                className="form-control form-control-sm font-monospace"
                                style={{ backgroundColor: isDark ? '#1a1a1c' : '#fff', color: textColor, borderColor: cardBorder }}
                                value={item.descripcion}
                                onChange={(e) => {
                                  const copy = [...itemsDetectados];
                                  copy[idx].descripcion = e.target.value;
                                  setItemsDetectados(copy);
                                }}
                              />
                              {!item.encontradoEnBd && (
                                <small className="text-danger d-block mt-1">
                                  <i className="bi bi-exclamation-circle me-1"></i>
                                  {item.advertencia || 'No se pudo detectar este ítem en la BD'}
                                </small>
                              )}
                            </div>
                          </td>
                          <td style={{ backgroundColor: 'inherit' }}>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="form-control form-control-sm font-monospace"
                              style={{ backgroundColor: isDark ? '#1a1a1c' : '#fff', color: textColor, borderColor: cardBorder }}
                              value={item.cantidad}
                              onChange={(e) => {
                                const copy = [...itemsDetectados];
                                copy[idx].cantidad = Number(e.target.value);
                                copy[idx].precioTotalDetectado = null;
                                setItemsDetectados(copy);
                              }}
                            />
                          </td>
                          <td style={{ backgroundColor: 'inherit' }}>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              className="form-control form-control-sm font-monospace"
                              style={{ backgroundColor: isDark ? '#1a1a1c' : '#fff', color: textColor, borderColor: cardBorder }}
                              value={
                                item.precioUnitario !== null && item.precioUnitario !== undefined
                                  ? Number(item.precioUnitario).toFixed(3)
                                  : ''
                              }
                              onChange={(e) => {
                                const copy = [...itemsDetectados];
                                const val = parseFloat(e.target.value);
                                copy[idx].precioUnitario = isNaN(val) ? 0 : Number(val.toFixed(3));
                                copy[idx].precioTotalDetectado = null;
                                setItemsDetectados(copy);
                              }}
                            />
                          </td>
                          <td className="text-end fw-bold" style={{ backgroundColor: 'inherit' }}>
                            ${calcularSubtotal(item).toFixed(2)}
                          </td>
                          <td className="text-center" style={{ backgroundColor: 'inherit' }}>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm py-0 px-2"
                              onClick={() => handleEliminarItemDetectado(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top border-secondary">
            <button type="button" className="btn btn-danger px-4" onClick={onClose}>
              Cancelar
            </button>
            {itemsDetectados.length > 0 && (
              <button
                type="button"
                className="btn btn-success px-4 fw-bold"
                onClick={handleConfirmar}
              >
                <i className="bi bi-plus-circle me-1"></i> Cargar ítems a la Compra
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};