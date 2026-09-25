import React from 'react';
import type { Proveedor } from '../../proveedores/types/Proveedor';

interface DatosCompraFormProps {
  proveedores: Proveedor[];
  idProveedorSel: string;
  setIdProveedorSel: (val: string) => void;

  metodoPago: string;
  onCambiarMetodoPago: (val: string) => void;

  observaciones: string;
  setObservaciones: (val: string) => void;

  montoTotalGlobal: string;
  modificadoManualmente: boolean;
  onCambiarMontoTotal: (val: string) => void;

  comprobanteImagen: string | null;
  nombreArchivo: string;
  onImagenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuitarComprobante: () => void;

  isDark: boolean;
  textColor: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
}

export const DatosCompraForm: React.FC<DatosCompraFormProps> = ({
  proveedores,
  idProveedorSel,
  setIdProveedorSel,
  metodoPago,
  onCambiarMetodoPago,
  observaciones,
  setObservaciones,
  montoTotalGlobal,
  modificadoManualmente,
  onCambiarMontoTotal,
  comprobanteImagen,
  nombreArchivo,
  onImagenChange,
  onQuitarComprobante,
  isDark,
  textColor,
  cardBg,
  cardBorder,
  inputBg,
  inputBorder
}) => {
  return (
    <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
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
            {proveedores.map((p: any) => (
              <option key={p.id_proveedor || p.idProveedor || p.id} value={p.id_proveedor || p.idProveedor || p.id}>
                {p.nombre_comercial || p.nombreComercial}
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
            onChange={(e) => onCambiarMetodoPago(e.target.value)}
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
            className="form-control font-monospace fw-bold text-danger "
            style={{ backgroundColor: inputBg, borderColor: inputBorder, fontSize: '1rem', color: "#149bdf" }}
            value={montoTotalGlobal}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onCambiarMontoTotal(e.target.value)}
            required
          />
        </div>
      </div>

      {metodoPago === 'TRANSFERENCIA' && (
        <div className="mt-3">
          {!comprobanteImagen ? (
            <label
              className="btn btn-sm px-3 py-2 fw-bold d-inline-flex align-items-center gap-2 m-0 shadow-sm"
              style={{
                backgroundColor: isDark ? '#1a1a1c' : '#f8fafc',
                border: `1px solid ${isDark ? '#38bdf8' : '#0284c7'}`,
                color: isDark ? '#38bdf8' : '#0284c7',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-cloud-arrow-up fs-6"></i>
              <span>Vincular Comprobante de Transferencia</span>
              <input
                type="file"
                accept="image/*"
                onChange={onImagenChange}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div
              className="d-inline-flex align-items-center gap-2 p-1 px-3 rounded shadow-sm"
              style={{ backgroundColor: isDark ? '#121214' : '#f1f5f9', border: `1px solid ${cardBorder}` }}
            >
              <i className="bi bi-file-earmark-image text-primary fs-6"></i>
              <span className="small">{nombreArchivo || 'comprobante.png'}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger border-0 p-1"
                onClick={onQuitarComprobante}
                title="Quitar comprobante"
              >
                <i className="bi bi-trash-fill fs-6"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
