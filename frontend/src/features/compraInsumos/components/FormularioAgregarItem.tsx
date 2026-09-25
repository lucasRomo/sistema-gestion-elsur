import React from 'react';
import { SearchableSelect, type OptionItem } from './SearchableSelect';

interface FormularioAgregarItemProps {
  tipoItem: 'INSUMO' | 'PRODUCTO';
  onCambiarTipoItem: (tipo: 'INSUMO' | 'PRODUCTO') => void;
  onAbrirModalIA: () => void;

  esNuevoInsumo: boolean;
  onCambiarEsNuevoInsumo: (val: boolean) => void;
  idInsumoSel: string;
  onSelectInsumo: (val: string) => void;
  opcionesInsumos: OptionItem[];

  nombreNuevo: string;
  setNombreNuevo: (val: string) => void;
  idUnidad: string;
  setIdUnidad: (val: string) => void;
  idUnidadCompra: string;
  setIdUnidadCompra: (val: string) => void;
  factorConversion: string;
  setFactorConversion: (val: string) => void;
  unidadesMedida: any[];

  idProductoSel: string;
  onSelectProducto: (val: string) => void;
  opcionesProductos: OptionItem[];

  cantidad: string;
  setCantidad: (val: string) => void;
  precioUnitario: string;
  setPrecioUnitario: (val: string) => void;
  onAgregarItem: () => void;

  isDark: boolean;
  textColor: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
}

export const FormularioAgregarItem: React.FC<FormularioAgregarItemProps> = ({
  tipoItem,
  onCambiarTipoItem,
  onAbrirModalIA,
  esNuevoInsumo,
  onCambiarEsNuevoInsumo,
  idInsumoSel,
  onSelectInsumo,
  opcionesInsumos,
  nombreNuevo,
  setNombreNuevo,
  idUnidad,
  setIdUnidad,
  idUnidadCompra,
  setIdUnidadCompra,
  factorConversion,
  setFactorConversion,
  unidadesMedida,
  idProductoSel,
  onSelectProducto,
  opcionesProductos,
  cantidad,
  setCantidad,
  precioUnitario,
  setPrecioUnitario,
  onAgregarItem,
  isDark,
  textColor,
  cardBg,
  cardBorder,
  inputBg,
  inputBorder
}) => {
  return (
    <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-info-custom m-0"><i className="bi bi-cart-plus me-2"></i>Agregar Ítems a la Compra</h5>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            onClick={onAbrirModalIA}
            style={{ backgroundColor: '#7109e7', border: 'none', color: "#ffffff" }}
          >
            <i className="bi bi-magic"></i> Cargar con IA
          </button>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-sm fw-semibold"
              style={{
                backgroundColor: tipoItem === 'INSUMO' ? '#0f4685' : (isDark ? '#2b3035' : '#e2e8f0'),
                color: tipoItem === 'INSUMO' ? '#ffffff' : (isDark ? '#a0a0a0' : '#475569'),
                border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
              }}
              onClick={() => onCambiarTipoItem('INSUMO')}
            >
              Insumo
            </button>
            <button
              type="button"
              className="btn btn-sm fw-semibold"
              style={{
                backgroundColor: tipoItem === 'PRODUCTO' ? '#2225d8' : (isDark ? '#2b3035' : '#e2e8f0'),
                color: tipoItem === 'PRODUCTO' ? '#ffffff' : (isDark ? '#a0a0a0' : '#475569'),
                border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
              }}
              onClick={() => onCambiarTipoItem('PRODUCTO')}
            >
              Producto (Sin Receta)
            </button>
          </div>
        </div>
      </div>

      {tipoItem === 'INSUMO' ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold small">Origen del Insumo:</span>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm fw-semibold"
                style={{
                  backgroundColor: !esNuevoInsumo ? '#d17b0a' : (isDark ? '#2b3035' : '#e2e8f0'),
                  color: !esNuevoInsumo ? '#ffffff' : (isDark ? '#a0a0a0' : '#475569'),
                  border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
                }}
                onClick={() => onCambiarEsNuevoInsumo(false)}
              >
                Insumo Existente
              </button>
              <button
                type="button"
                className="btn btn-sm fw-semibold"
                style={{
                  backgroundColor: esNuevoInsumo ? '#258618' : (isDark ? '#2b3035' : '#e2e8f0'),
                  color: esNuevoInsumo ? '#ffffff' : (isDark ? '#a0a0a0' : '#475569'),
                  border: `1px solid ${isDark ? '#3f3f46' : '#cbd5e1'}`
                }}
                onClick={() => onCambiarEsNuevoInsumo(true)}
              >
                + Nuevo Insumo
              </button>
            </div>
          </div>

          {!esNuevoInsumo ? (
            <div className="mb-3">
              <label className="form-label small fw-semibold">Buscar / Seleccionar Insumo Existente</label>
              <SearchableSelect
                options={opcionesInsumos}
                value={idInsumoSel}
                onChange={onSelectInsumo}
                placeholder="-- Escriba para buscar Insumo --"
                isDark={isDark}
              />
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Nombre del Nuevo Insumo *</label>
                <input
                  type="text"
                  className="form-control font-monospace"
                  style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                  placeholder="Ej. Resma A4 75gr Chamex"
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                />
              </div>

              <div className="compra-scroll-x d-flex gap-3 mb-3 pb-2">
                <div style={{ minWidth: 220, flex: '1 1 220px' }}>
                  <label className="form-label small fw-semibold">Unidad Suelta (Consumo) *</label>
                  <select
                    className="form-select font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={idUnidad}
                    onChange={(e) => setIdUnidad(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {unidadesMedida.map((u: any) => (
                      <option key={u.id_unidad || u.idUnidad || u.id} value={u.id_unidad || u.idUnidad || u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: 220, flex: '1 1 220px' }}>
                  <label className="form-label small fw-semibold">Unidad Empaque (Compra) *</label>
                  <select
                    className="form-select font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    value={idUnidadCompra}
                    onChange={(e) => setIdUnidadCompra(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {unidadesMedida.map((u: any) => (
                      <option key={u.id_unidad || u.idUnidad || u.id} value={u.id_unidad || u.idUnidad || u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: 180, flex: '1 1 180px' }}>
                  <label className="form-label small fw-semibold">Factor Conversión</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control font-monospace"
                    style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                    placeholder="Ej. 500"
                    value={factorConversion}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFactorConversion(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="mb-3">
          <label className="form-label small fw-semibold">Buscar / Seleccionar Producto Existente (Sin Receta)</label>
          <SearchableSelect
            options={opcionesProductos}
            value={idProductoSel}
            onChange={onSelectProducto}
            placeholder="-- Escriba para buscar Producto --"
            isDark={isDark}
          />
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-semibold">
            {tipoItem === 'INSUMO' ? 'Cant. Empaques' : 'Cantidad Unidades'}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="form-control font-monospace"
            style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
            value={cantidad}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-semibold">Precio Unit. ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="form-control font-monospace"
            style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
            value={precioUnitario}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setPrecioUnitario(e.target.value)}
          />
        </div>

        <div className="col-md-4 d-flex align-items-end">
          <button
            type="button"
            className="btn btn-primary w-100 fw-semibold py-2"
            onClick={onAgregarItem}
          >
            <i className="bi bi-plus-circle me-1"></i> Añadir a la Lista
          </button>
        </div>
      </div>
    </div>
  );
};
