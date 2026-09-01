import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../Context/ThemeContext';
import { useTurno } from '../../../Context/TurnoContext';

import { useCompraInsumosData } from '../hooks/useCompraInsumosData';
import { SearchableSelect, type OptionItem } from '../components/SearchableSelect';
import { TablaItemsCompra } from '../components/TablaItemsCompra';
import { AvisoValidacionModal } from '../modals/AvisoValidacionModal';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { ModalCargaIA } from '../modals/ModalCargaIA';

import { compraInsumosService } from '../services/compraInsumosService';
import type { ItemCompraInsumo, DatosCompraInsumo } from '../types/compraInsumos';

export const CompraInsumosView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { cajaAbierta } = useTurno();
  const isDark = theme === 'dark';

  const textColor = isDark ? 'text-white' : 'text-dark';
  const cardBg = isDark ? '#1e1e1f' : '#ffffff';
  const cardBorder = isDark ? '#242427' : '#cbd5e1';
  const inputBg = isDark ? '#222122' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#cbd5e1';

  const { insumos, productos, proveedores, unidadesMedida, recargarTodo } = useCompraInsumosData();

  const [tipoItem, setTipoItem] = useState<'INSUMO' | 'PRODUCTO'>('INSUMO');
  const [loading, setLoading] = useState(false);
  const [itemsCompra, setItemsCompra] = useState<ItemCompraInsumo[]>([]);

  const [avisoModal, setAvisoModal] = useState<string | null>(null);
  const [modalIaAbierto, setModalIaAbierto] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);

  const [esNuevoInsumo, setEsNuevoInsumo] = useState(false);
  const [idInsumoSel, setIdInsumoSel] = useState<string>('');
  const [idProductoSel, setIdProductoSel] = useState<string>('');
  const [nombreNuevo, setNombreNuevo] = useState('');

  const [cantidad, setCantidad] = useState<string>('1');
  const [precioUnitario, setPrecioUnitario] = useState<string>('0');
  const [factorConversion, setFactorConversion] = useState<string>('1');
  const [idUnidad, setIdUnidad] = useState<string>('');
  const [idUnidadCompra, setIdUnidadCompra] = useState<string>('');

  const [idProveedorSel, setIdProveedorSel] = useState<string>('');
  const [montoTotalGlobal, setMontoTotalGlobal] = useState<string>('0');
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [modificadoManualmente, setModificadoManualmente] = useState(false);

  const [comprobanteImagen, setComprobanteImagen] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');

  const resetFormItem = () => {
    setEsNuevoInsumo(false);
    setIdInsumoSel('');
    setIdProductoSel('');
    setNombreNuevo('');
    setCantidad('1');
    setPrecioUnitario('0');
    setFactorConversion('1');
    setIdUnidad('');
    setIdUnidadCompra('');
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setComprobanteImagen(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectInsumo = (val: string) => {
    setIdInsumoSel(val);
    const ins = insumos.find((i: any) => String(i.idInsumo || i.id) === String(val));
    if (ins) {
      setPrecioUnitario(String(ins.precio || 0));
      setFactorConversion(String(ins.factorConversion || 1));
    }
  };

  const handleSelectProducto = (val: string) => {
    setIdProductoSel(val);
    const prod = productos.find((p: any) => String(p.idProducto) === String(val));
    if (prod) {
      setPrecioUnitario(String(prod.precioBase || 0));
      setFactorConversion('1');
    }
  };

  const handleAgregarItem = () => {
    const cantNum = Number(cantidad);
    const precioNum = Number(precioUnitario);
    const factorNum = Number(factorConversion);

    if (tipoItem === 'INSUMO') {
      if (!esNuevoInsumo && !idInsumoSel) return setAvisoModal('Debe seleccionar un insumo existente.');
      if (esNuevoInsumo) {
        if (!nombreNuevo.trim()) return setAvisoModal('Debe ingresar el nombre del nuevo insumo.');
        if (!idUnidad || !idUnidadCompra) return setAvisoModal('Debe seleccionar la Unidad Suelta y la Unidad Empaque.');
        if (isNaN(factorNum) || factorNum <= 0) return setAvisoModal('El factor de conversión debe ser mayor a 0.');
      }
    } else {
      if (!idProductoSel) return setAvisoModal('Debe seleccionar un producto existente sin receta.');
    }

    if (isNaN(cantNum) || cantNum <= 0) return setAvisoModal('La cantidad debe ser mayor a 0.');
    if (isNaN(precioNum) || precioNum < 0) return setAvisoModal('El precio unitario no puede ser negativo.');

    let itemNombre = '';
    if (tipoItem === 'INSUMO') {
      itemNombre = esNuevoInsumo
        ? nombreNuevo.trim()
        : insumos.find((i: any) => String(i.idInsumo || i.id) === String(idInsumoSel))?.nombreInsumo || '';
    } else {
      itemNombre = productos.find((p: any) => String(p.idProducto) === String(idProductoSel))?.nombreProducto || '';
    }

    const subtotal = Number((cantNum * precioNum).toFixed(2));

    const nuevoItem: ItemCompraInsumo = {
      tipoItem,
      idInsumo: tipoItem === 'INSUMO' && !esNuevoInsumo ? Number(idInsumoSel) : undefined,
      idProducto: tipoItem === 'PRODUCTO' ? Number(idProductoSel) : undefined,
      esNuevoInsumo: tipoItem === 'INSUMO' ? esNuevoInsumo : false,
      nombreInsumo: itemNombre,
      cantidadEmpaquetada: cantNum,
      precioUnitario: precioNum,
      subtotal,
      factorConversion: tipoItem === 'INSUMO' ? factorNum : 1,
      idUnidad: idUnidad ? Number(idUnidad) : undefined,
      idUnidadCompra: idUnidadCompra ? Number(idUnidadCompra) : undefined
    };

    const nuevaLista = [...itemsCompra, nuevoItem];
    setItemsCompra(nuevaLista);

    if (!modificadoManualmente) {
      const nuevoTotal = nuevaLista.reduce((acc, item) => acc + item.subtotal, 0);
      setMontoTotalGlobal(String(nuevoTotal.toFixed(2)));
    }

    resetFormItem();
  };

  const handleEliminarItem = (index: number) => {
    const nuevaLista = itemsCompra.filter((_, i) => i !== index);
    setItemsCompra(nuevaLista);

    if (!modificadoManualmente) {
      const nuevoTotal = nuevaLista.reduce((acc, item) => acc + item.subtotal, 0);
      setMontoTotalGlobal(String(nuevoTotal.toFixed(2)));
    }
  };

  const handleConfirmarItemsIa = (nuevosItems: ItemCompraInsumo[]) => {
    const nuevaLista = [...itemsCompra, ...nuevosItems];
    setItemsCompra(nuevaLista);

    if (!modificadoManualmente) {
      const nuevoTotal = nuevaLista.reduce((acc, item) => acc + item.subtotal, 0);
      setMontoTotalGlobal(String(nuevoTotal.toFixed(2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cajaAbierta) return setAvisoModal('No se puede registrar una compra si la caja no está abierta.');
    const montoTotalNum = Number(montoTotalGlobal);
    if (itemsCompra.length === 0) return setAvisoModal('Debe agregar al menos un ítem a la lista de compra.');
    if (isNaN(montoTotalNum) || montoTotalNum <= 0) return setAvisoModal('El monto total debe ser mayor a 0.');

    setLoading(true);
    try {
      const resumenItems = itemsCompra.map(i => `${i.nombreInsumo} (${i.tipoItem}) x${i.cantidadEmpaquetada}`).join(', ');
      const provSeleccionado = proveedores.find(p => String(p.idProveedor) === idProveedorSel);
      const textoProveedor = provSeleccionado ? ` - Prov: ${provSeleccionado.nombreComercial}` : '';

      const datosCompra: DatosCompraInsumo = {
        montoTotal: montoTotalNum,
        metodoPago,
        concepto: `Compra Directa: ${resumenItems}${textoProveedor}${observaciones ? ` - ${observaciones}` : ''}`,
        idProveedor: idProveedorSel ? Number(idProveedorSel) : undefined,
        items: itemsCompra,
        comprobanteImagen: metodoPago === 'TRANSFERENCIA' ? comprobanteImagen : null
      };

      const resultado = await compraInsumosService.registrarCompraInsumo(datosCompra);

      const movimientoInsumo = {
        id_movimiento: resultado?.idMovimiento || resultado?.id_movimiento,
        monto: montoTotalNum,
        tipoMovimiento: 'EGRESO',
        categoria: 'INSUMOS',
        descripcion: datosCompra.concepto,
        fecha: new Date().toISOString(),
        metodoPago
      };

      const pedidoAdaptado = {
        id_pedido: resultado?.idCompra || resultado?.id_compra || '-',
        cliente: {
          persona: null,
          razon_social: 'Compra Insumos/Productos / Proveedor',
          nombre: 'Compra Insumos/Productos / Proveedor'
        },
        monto_total: montoTotalNum,
        observaciones: datosCompra.concepto
      };

      setTicketSeleccionado({ pedido: pedidoAdaptado, movimiento: movimientoInsumo });
      setItemsCompra([]);
      setMontoTotalGlobal('0');
      setObservaciones('');
      setComprobanteImagen(null);
      setNombreArchivo('');
      recargarTodo();
    } catch (error: any) {
      setAvisoModal('Error procesando la compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const opcionesInsumos: OptionItem[] = insumos.map(i => ({
    id: i.idInsumo || i.id,
    label: i.nombreInsumo,
    sublabel: `Stock Bultos: ${i.stockEmpaquetado || 0} - $${i.precio}`
  }));

  const opcionesProductos: OptionItem[] = productos.map(p => ({
    id: p.idProducto,
    label: p.nombreProducto,
    sublabel: `Stock Actual: ${p.stock || 0} - $${p.precioBase}`
  }));

  return (
    <div className={`container-fluid p-3 font-monospace ${textColor}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mx-auto font-monospace" style={{ fontSize: '2.5rem' }}>Compra de Insumos y Productos</h1>
      </div>

      {!cajaAbierta && (
        <div className="alert alert-warning text-center font-monospace mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Atención:</strong> La Caja se encuentra cerrada. Debe abrir turno en Caja para poder registrar compras.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="p-4 rounded-3 mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-info-custom m-0"><i className="bi bi-cart-plus me-2"></i>Agregar Ítems a la Compra</h5>
            <div className="d-flex align-items-center gap-2">
  <button
    type="button"
    className="btn btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
    onClick={() => setModalIaAbierto(true)}
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
      onClick={() => { setTipoItem('INSUMO'); resetFormItem(); }}
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
      onClick={() => { setTipoItem('PRODUCTO'); resetFormItem(); }}
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
      onClick={() => setEsNuevoInsumo(false)}
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
      onClick={() => setEsNuevoInsumo(true)}
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
                    onChange={handleSelectInsumo}
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

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Unidad Suelta (Consumo) *</label>
                      <select
                        className="form-select font-monospace"
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        value={idUnidad}
                        onChange={(e) => setIdUnidad(e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {unidadesMedida.map((u: any) => (
                          <option key={u.idUnidad} value={u.idUnidad}>{u.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Unidad Empaque (Compra) *</label>
                      <select
                        className="form-select font-monospace"
                        style={{ backgroundColor: inputBg, color: textColor, borderColor: inputBorder }}
                        value={idUnidadCompra}
                        onChange={(e) => setIdUnidadCompra(e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
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
                onChange={handleSelectProducto}
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
                min="0"
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
                onClick={handleAgregarItem}
              >
                <i className="bi bi-plus-circle me-1"></i> Añadir a la Lista
              </button>
            </div>
          </div>
        </div>

        <TablaItemsCompra
          items={itemsCompra}
          onEliminar={handleEliminarItem}
          isDark={isDark}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />

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
                className="form-control font-monospace fw-bold text-danger "
                style={{ backgroundColor: inputBg, borderColor: inputBorder, fontSize: '1rem', color: "#149bdf" }}
                value={montoTotalGlobal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setMontoTotalGlobal(e.target.value);
                  setModificadoManualmente(true);
                }}
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
                    onChange={handleImagenChange}
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
                    onClick={() => { setComprobanteImagen(null); setNombreArchivo(''); }}
                    title="Quitar comprobante"
                  >
                    <i className="bi bi-trash-fill fs-6"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-3">
          <button type="button" className="btn btn-secondary px-4 py-2 fw-bold" onClick={() => navigate('/caja')}>
            Volver a Caja
          </button>
          <button
            type="submit"
            className="btn px-4 py-2 fw-bold"
            style={{ backgroundColor: '#258618', color: "#ffffff" }}
            disabled={loading || !cajaAbierta}
          >
            {loading ? 'Procesando...' : 'Confirmar Compra'}
          </button>
        </div>
      </form>

      <ModalCargaIA
        isOpen={modalIaAbierto}
        onClose={() => setModalIaAbierto(false)}
        onConfirmarItems={handleConfirmarItemsIa}
        insumos={insumos}
        productos={productos}
        unidadesMedida={unidadesMedida}
        isDark={isDark}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={textColor}
      />

      {avisoModal && (
        <AvisoValidacionModal
          mensaje={avisoModal}
          onClose={() => setAvisoModal(null)}
          isDark={isDark}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
        />
      )}

      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={true}
        />
      )}
    </div>
  );
};