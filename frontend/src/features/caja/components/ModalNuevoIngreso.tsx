import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../Context/ThemeContext';
import type { NuevoMovimientoDTO } from '../services/cajaService';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (data: NuevoMovimientoDTO) => void;
}

export const ModalNuevoIngreso: React.FC<ModalProps> = ({ isOpen, onClose, onGuardar }) => {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('INGRESO');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [idPedido, setIdPedido] = useState<string | null>(null);
  const [fechaPlaceholder, setFechaPlaceholder] = useState('');
  const [comprobanteImagen, setComprobanteImagen] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const modalBg = isDark ? '#18181b' : '#ffffff';
  const modalBorder = isDark ? '#3f3f46' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const labelColor = isDark ? '#e4e4e7' : '#334155';
  
  const inputBg = isDark ? '#27272a' : '#f8fafc';
  const inputBorder = isDark ? '#52525b' : '#cbd5e1';
  const inputTextColor = isDark ? '#ffffff' : '#0f172a';

  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const fechaFormato = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear().toString().substring(2)} - ${hoy.toLocaleTimeString()}`;
      setFechaPlaceholder(fechaFormato);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const esEgreso = (cat: string) => {
    return ['EGRESO', 'INSUMOS', 'EGRESO_INSUMOS', 'MANTENIMIENTO', 'EGRESO_MANTENIMIENTO'].includes(cat);
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

  const handleSubmit = () => {
    if (!monto || Number(monto) <= 0) {
      alert("Por favor ingrese un monto válido mayor a 0.");
      return;
    }
    if (!concepto.trim()) {
      alert("Por favor ingrese la descripción o concepto del movimiento.");
      return;
    }

    onGuardar({
      monto: Number(monto),
      concepto: concepto.trim(),
      tipoMovimiento: esEgreso(categoria) ? 'EGRESO' : 'INGRESO',
      categoria,
      metodoPago,
      idPedido: idPedido === "no-pedido" ? null : idPedido,
      comprobanteImagen: metodoPago === 'TRANSFERENCIA' ? comprobanteImagen : null
    });

    setMonto('');
    setConcepto('');
    setCategoria('INGRESO');
    setMetodoPago('EFECTIVO');
    setComprobanteImagen(null);
    setNombreArchivo('');
  };

  return (
    <div className="modal d-block font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div 
          className="modal-content shadow-lg p-4" 
          style={{ 
            backgroundColor: modalBg, 
            borderColor: modalBorder, 
            borderRadius: '14px',
            border: `1px solid ${modalBorder}` 
          }}
        >
          <div className="modal-header border-0 justify-content-center pt-1 pb-2">
            <h3 className="fw-bold m-0" style={{ color: textColor, letterSpacing: '0.5px' }}>
              Nuevo Movimiento de Caja
            </h3>
          </div>

          <div className="modal-body border-0 position-relative py-3">
            <div 
              className="position-absolute start-50 top-50 translate-middle w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none" 
              style={{ zIndex: 0, userSelect: 'none', opacity: isDark ? 0.08 : 0.04 }}
            >
              <span className="fw-bold" style={{ fontSize: '4.5rem', color: '#8e45e0' }}>{"{GestaPro}"}</span>
            </div>

            <div className="position-relative" style={{ zIndex: 1 }}>
              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Fecha del Movimiento
                </label>
                <input 
                  type="text" 
                  className="form-control fw-bold py-2 px-3" 
                  disabled 
                  value={fechaPlaceholder}
                  style={{ 
                    borderRadius: '8px', 
                    backgroundColor: isDark ? '#18181b' : '#e2e8f0', 
                    color: isDark ? '#a1a1aa' : '#64748b',
                    border: `1px solid ${inputBorder}`
                  }}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                    Categoría del Movimiento
                  </label>
                  <select 
                    className="form-select py-2 px-3 fw-medium" 
                    style={{ 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      backgroundColor: inputBg,
                      color: inputTextColor,
                      border: `1px solid ${inputBorder}`
                    }}
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <optgroup label="Ingresos (+)">
                      <option value="INGRESO">Ingreso comun</option>
                      <option value="CTA_CTE">Cobro Cuenta Corriente</option>
                    </optgroup>
                    <optgroup label="Egresos (-)">
                      <option value="EGRESO">Egreso comun</option>
                      <option value="INSUMOS">Compra de Insumos</option>
                      <option value="MANTENIMIENTO">Gastos de Mantenimiento</option>
                    </optgroup>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                    Método de Pago
                  </label>
                  <select 
                    className="form-select py-2 px-3 fw-medium" 
                    style={{ 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      backgroundColor: inputBg,
                      color: inputTextColor,
                      border: `1px solid ${inputBorder}`
                    }}
                    value={metodoPago}
                    onChange={(e) => {
                      setMetodoPago(e.target.value);
                      if (e.target.value !== 'TRANSFERENCIA') {
                        setComprobanteImagen(null);
                        setNombreArchivo('');
                      }
                    }}
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="DEBITO">DÉBITO</option>
                    <option value="CREDITO">CRÉDITO</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Monto ($)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="Ej: 2500.00" 
                  className="form-control py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label small fw-bold mb-1" style={{ color: labelColor }}>
                  Descripción / Detalle
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Cobro de saldo pendiente / Reparación de impresora" 
                  className="form-control py-2 px-3 fw-medium" 
                  style={{ 
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    color: inputTextColor,
                    border: `1px solid ${inputBorder}`
                  }}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                />
              </div>

              {/* Contenedor de Comprobante Adjuntado (Estilo Registrar Pago) */}
              {metodoPago === 'TRANSFERENCIA' && comprobanteImagen && (
                <div className="mt-3">
                  <div 
                    className="d-flex align-items-center justify-content-between p-2 rounded shadow-sm" 
                    style={{ 
                      backgroundColor: isDark ? '#121214' : '#f1f5f9', 
                      border: `1px solid ${modalBorder}` 
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <i className="bi bi-file-earmark-image text-primary fs-5"></i>
                      <span className="small text-truncate" style={{ color: labelColor, maxWidth: '280px' }}>
                        {nombreArchivo || 'comprobante.png'}
                      </span>
                    </div>
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
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 d-flex justify-content-between align-items-center pt-3 px-0">
            <button 
              className="btn btn-sm px-3 py-2 fw-bold border-0 shadow-sm" 
              style={{ backgroundColor: '#a52a2a', color: '#ffffff', borderRadius: '6px', width: '30%' }}
              onClick={onClose}
            >
              Cancelar
            </button>

            {metodoPago === 'TRANSFERENCIA' && (
              <label 
                className="btn btn-sm px-2 py-2 fw-bold d-flex justify-content-center align-items-center gap-2 m-0 shadow-sm" 
                style={{ 
                  backgroundColor: isDark ? '#1a1a1c' : '#f8fafc', 
                  border: `1px solid ${isDark ? '#38bdf8' : '#0284c7'}`, 
                  color: isDark ? '#38bdf8' : '#0284c7', 
                  borderRadius: '8px', 
                  width: '35%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="bi bi-cloud-arrow-up fs-6"></i>
                <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                  {comprobanteImagen ? 'Cambiar Comprobante' : 'Vincular Comprobante'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImagenChange} 
                  style={{ display: 'none' }} 
                />
              </label>
            )}

            <button 
              className="btn btn-sm px-3 py-2 fw-bold border-0 shadow-sm" 
              style={{ 
                backgroundColor: '#2b7a3e', 
                color: '#ffffff', 
                borderRadius: '6px', 
                width: '30%',
                marginLeft: metodoPago !== 'TRANSFERENCIA' ? 'auto' : undefined 
              }}
              onClick={handleSubmit}
            >
              Guardar Movimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};