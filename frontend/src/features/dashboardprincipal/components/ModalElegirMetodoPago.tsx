import React, { useState } from 'react';
import { useTheme } from '../../../Context/ThemeContext';

import { formatearMonto } from '../../../utils/formato';
interface Props {
  show: boolean;
  onClose: () => void;
  total: number;
  onConfirmarPago: (datosPago: {
    tipoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO';
    comprobanteFile?: File | null;
    montoRecibido?: number;
  }) => void;
}

// Billetes "redondos" que suele entregar el cliente, para cargar el monto recibido con un clic.
const BILLETES_SUGERIDOS = [1000, 2000, 5000, 10000, 20000];

const sugerenciasDePago = (total: number): number[] => {
  const sugeridas = new Set<number>();
  for (const billete of BILLETES_SUGERIDOS) {
    const redondeado = Math.ceil(total / billete) * billete;
    if (redondeado > total) sugeridas.add(redondeado);
    if (sugeridas.size === 3) break;
  }
  return [...sugeridas].sort((a, b) => a - b);
};

export const ModalElegirMetodoPago: React.FC<Props> = ({
  show,
  onClose,
  total,
  onConfirmarPago
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tipoPago, setTipoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO'>('EFECTIVO');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [pagaCon, setPagaCon] = useState('');

  if (!show) return null;

  // En efectivo el monto recibido es obligatorio y tiene que cubrir el total: antes se podía
  // cobrar una venta de $5.000 cargando que el cliente pagó $5, y la caja la registraba completa.
  // Se compara en centavos para no fallar por redondeos ($1.234,50 vs 1234.5000001).
  const pagaConNum = Number(pagaCon.replace(',', '.'));
  const hayPagaCon = pagaCon.trim() !== '' && Number.isFinite(pagaConNum) && pagaConNum >= 0;
  const cubreTotal = hayPagaCon && Math.round(pagaConNum * 100) >= Math.round(total * 100);
  const vuelto = hayPagaCon ? pagaConNum - total : 0;
  const puedeCobrar = tipoPago !== 'EFECTIVO' || cubreTotal;

  const bgModal = isDark ? '#1b1b1b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const cardBg = isDark ? '#16181d' : '#f8fafc';
  const cardBorder = isDark ? '#2a313d' : '#e2e8f0';
  const selectBg = isDark ? '#1b1b1b' : '#ffffff';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCobrar) return;

    onConfirmarPago({
      tipoPago,
      comprobanteFile,
      montoRecibido: tipoPago === 'EFECTIVO' ? pagaConNum : undefined
    });
  };

  return (
    <div className="modal show d-block font-monospace" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px'}}>
        <div
  className="modal-content shadow-lg"
  style={{
    backgroundColor: bgModal,
    border: '1.5px solid #10b981',
    borderRadius: '16px',
    color: textColor
  }}
>

          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 fs-5" style={{ color: '#10b981' }}>
              <i className="bi bi-currency-dollar fs-4"></i> Método de Pago
            </h5>
            <button
              type="button"
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`}
              onClick={onClose}
              style={{ opacity: 0.8 }}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 pt-3 pb-2">

              <div
                className="p-3 mb-3 text-center rounded d-flex justify-content-between align-items-center"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`
                }}
              >
                <span className="small fw-semibold" style={{ color: subTextColor }}>Total a Cobrar :</span>
                <span className="fw-bold fs-5" style={{ color: '#22c55e' }}>${formatearMonto(total)}</span>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small mb-1" style={{ color: textColor }}>Tipo de Pago:</label>
                <select
                  className="form-select font-monospace"
                  style={{
                    backgroundColor: selectBg,
                    color: textColor,
                    borderColor: '#0284c7',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 1px #0284c7',
                    padding: '10px 14px'
                  }}
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value as any)}
                >
                  <option value="EFECTIVO" style={{ backgroundColor: selectBg, color: textColor }}>EFECTIVO</option>
                  <option value="TRANSFERENCIA" style={{ backgroundColor: selectBg, color: textColor }}>TRANSFERENCIA</option>
                  <option value="DEBITO" style={{ backgroundColor: selectBg, color: textColor }}>DÉBITO / CRÉDITO</option>
                </select>
              </div>

              {tipoPago === 'EFECTIVO' && (
                <div className="mb-3">
                  <label className="form-label fw-bold small mb-1" style={{ color: textColor }} htmlFor="pagaConInput">
                    Monto recibido del cliente:
                  </label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ backgroundColor: cardBg, color: subTextColor, borderColor: cardBorder }}>$</span>
                    <input
                      id="pagaConInput"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="form-control font-monospace"
                      style={{ backgroundColor: selectBg, color: textColor, borderColor: cardBorder }}
                      placeholder="Ej: 10000"
                      value={pagaCon}
                      onChange={(e) => setPagaCon(e.target.value)}
                      autoFocus
                      required
                      aria-invalid={hayPagaCon && !cubreTotal}
                    />
                  </div>
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {[{ texto: 'Exacto', valor: total }, ...sugerenciasDePago(total).map((v) => ({ texto: `$${formatearMonto(v)}`, valor: v }))].map((s) => (
                      <button
                        key={s.texto}
                        type="button"
                        className="btn btn-sm py-0 px-2 font-monospace"
                        style={{ fontSize: '0.75rem', borderRadius: '999px', border: `1px solid ${cardBorder}`, color: textColor, backgroundColor: cardBg }}
                        onClick={() => setPagaCon(String(Math.round(s.valor * 100) / 100))}
                      >
                        {s.texto}
                      </button>
                    ))}
                  </div>
                  {!hayPagaCon && (
                    <div className="small mt-2" style={{ color: subTextColor }}>
                      Ingresá con cuánto paga el cliente (o tocá "Exacto").
                    </div>
                  )}
                  {hayPagaCon && (
                    <div
                      className="mt-2 p-2 rounded d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: cardBg, border: `1px solid ${cubreTotal ? '#22c55e' : '#dc3545'}` }}
                      aria-live="polite"
                    >
                      <span className="small fw-semibold" style={{ color: subTextColor }}>{cubreTotal ? 'Vuelto:' : 'Falta:'}</span>
                      <span className="fw-bold fs-5" style={{ color: cubreTotal ? '#22c55e' : '#dc3545' }}>
                        ${formatearMonto(cubreTotal ? vuelto : Math.abs(vuelto))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {tipoPago === 'TRANSFERENCIA' && (
                <div className="mb-3">
                  <label className="form-label fw-bold small mb-1" style={{ color: textColor }}>Comprobante de Respaldo:</label>
                  <div className="position-relative">
                    <input
                      type="file"
                      id="comprobanteInput"
                      className="d-none"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor="comprobanteInput"
                      className="btn w-100 d-flex justify-content-center align-items-center gap-2 font-monospace"
                      style={{
                        backgroundColor: cardBg,
                        border: '1px solid #0891b2',
                        color: '#06b6d4',
                        borderRadius: '8px',
                        padding: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-5"></i>
                      <span className="text-truncate">
                        {comprobanteFile ? comprobanteFile.name : 'Vincular Comprobante (Opcional)'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer border-0 px-4 pb-4 pt-2 d-flex justify-content-end gap-2">
            <button
            type="button"
            className="btn btn-secondary fw-bold px-4"
            style={{ borderRadius: '8px' }}
            onClick={onClose}
            >
             Volver
            </button>
              <button
                type="submit"
                className="btn fw-bold px-4"
                style={{
                  backgroundColor: puedeCobrar ? '#10b92c' : '#52525b',
                  color: '#ffff',
                  borderRadius: '8px',
                  border: 'none',
                  opacity: puedeCobrar ? 1 : 0.6,
                  cursor: puedeCobrar ? 'pointer' : 'not-allowed'
                }}
                disabled={!puedeCobrar}
                title={puedeCobrar ? undefined : 'El monto recibido no cubre el total de la venta'}
              >
                Procesar Cobro
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};