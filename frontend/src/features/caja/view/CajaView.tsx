import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { SidebarLayout } from '../../../components/layouts/SidebarLayout';
import { useTurno } from '../../../Context/TurnoContext';
import { useTheme } from '../../../Context/ThemeContext';
import { exportarCajaExcel, exportarCajaPDF } from '../utils/ExportCajaUtils';

import { useCaja } from '../hooks/useCaja';
import { ModalNuevoIngreso } from '../components/ModalNuevoIngreso';
import { ModalConsultarArqueo } from '../components/ModalConsultarArqueo';
import { ModalCerrarTurno } from '../components/ModalCerrarTurno';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';
import { cajaService, type NuevoMovimientoDTO } from '../services/cajaService';
import { ResumenTurnoCard } from '../components/ResumenTurnoCard';
import { GraficoFlujoCajaCard } from '../components/GraficoFlujoCajaCard';
import { TablaMovimientosCaja } from '../components/TablaMovimientosCaja';
import { AccionesRapidasCaja } from '../components/AccionesRapidasCaja';
import { BarraAccionesTurno } from '../components/BarraAccionesTurno';

export const CajaView: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { cajaAbierta, setCajaAbierta } = useTurno();
  const isDark = theme === 'dark';

  const {
    saldoCaja,
    ingresosTurno,
    egresosTurno,
    turnoActual,
    movimientos,
    datosArqueo,
    inicializarCaja,
    abrirCaja,
    consultarArqueo,
    guardarMovimiento,
    ajustarMovimiento,
    cerrarCaja
  } = useCaja(setCajaAbierta);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModalApertura, setShowModalApertura] = useState(false);
  const [montoInicialInput, setMontoInicialInput] = useState('0');
  const [guardandoApertura, setGuardandoApertura] = useState(false);
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [showModalArqueo, setShowModalArqueo] = useState(false);

  const [avisoModal, setAvisoModal] = useState<string | null>(null);

  const [exitoModal, setExitoModal] = useState<{ titulo: string; descripcion: string } | null>(null);

  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [imagenComprobanteModal, setImagenComprobanteModal] = useState<string | null>(null);


  const [movimientoAjuste, setMovimientoAjuste] = useState<any | null>(null);
  const [montoAjuste, setMontoAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [metodoPagoAjuste, setMetodoPagoAjuste] = useState<string>('EFECTIVO');
  const [imagenAjuste, setImagenAjuste] = useState<string | null>(null);
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);
  const [comprobanteBlobUrl, setComprobanteBlobUrl] = useState<string | null>(null);
  const [cargandoComprobante, setCargandoComprobante] = useState(false);

  const textColor = isDark ? 'text-white' : 'text-dark';
  const cardBg = isDark ? '#1e1e1f' : '#ffffff';
  const cardBorder = isDark ? '#242427' : '#e2e8f0';
  const shadowStyle = isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
  const graphInnerBg = isDark ? '#222122' : '#f1f5f9';
  const tableWrapBg = isDark ? '#1d1d1d' : '#ffffff';
  const theadBg = isDark ? '#1d1d1d' : '#ffffff';

  const chartGrid = isDark ? '#2d2d30' : '#e2e8f0';
  const chartTick = isDark ? '#aaa' : '#64748b';
  const dotColor = isDark ? '#ffffff' : '#1e1e1f';

  useEffect(() => {
    inicializarCaja();
  }, [inicializarCaja]);

  const handleAbrirAperturaModal = () => {
    setMontoInicialInput('0');
    setShowModalApertura(true);
  };

  const handleImagenAjusteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenAjuste(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmarAperturaCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(montoInicialInput);
    if (isNaN(monto) || monto < 0) {
      setAvisoModal("Por favor, ingrese un monto inicial válido.");
      return;
    }

    setGuardandoApertura(true);
    try {
      await abrirCaja(monto);
      setShowModalApertura(false);
      setExitoModal({
        titulo: "Turno abierto con éxito.",
        descripcion: "Caja Abierta Registrada Correctamente"
      });
    } catch (error: any) {
      setAvisoModal("Error al abrir caja: " + error.message);
    } finally {
      setGuardandoApertura(false);
    }
  };

  const handleConsultarArqueo = async () => {
    try {
      await consultarArqueo();
      setShowModalArqueo(true);
    } catch (error) {
      console.error("Error consultando arqueo:", error);
    }
  };

  const handleGuardarMovimiento = async (data: NuevoMovimientoDTO) => {
    try {
      await guardarMovimiento(data);
      setIsModalOpen(false);
    } catch (error: any) {
      setAvisoModal("No se pudo guardar el movimiento: " + error.message);
    }
  };

  const handleConfirmarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movimientoAjuste) return;

    const montoNum = Number(montoAjuste);
    if (isNaN(montoNum) || montoNum <= 0) {
      setAvisoModal("Por favor ingrese un monto válido mayor a 0.");
      return;
    }

    if (!motivoAjuste.trim()) {
      setAvisoModal("Por favor ingrese la razón o motivo del ajuste.");
      return;
    }

    setGuardandoAjuste(true);
    try {
      await ajustarMovimiento(
        movimientoAjuste, 
        montoNum, 
        tipoAjuste, 
        motivoAjuste.trim(),
        metodoPagoAjuste,
        imagenAjuste
      );
      setMovimientoAjuste(null);
      setMotivoAjuste('');
      setMontoAjuste('');
      setMetodoPagoAjuste('EFECTIVO');
      setImagenAjuste(null);
    } catch (error: any) {
      setAvisoModal("Error al procesar la corrección: " + error.message);
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const handleAbrirCierreModal = async () => {
    if (!turnoActual) {
      setAvisoModal("No hay un turno activo para cerrar.");
      return;
    }
    try {
      await consultarArqueo();
    } catch (error) {
      console.error("Error al obtener arqueo previo al cierre:", error);
    }
    setShowModalCierre(true);
  };

  const ejecutarCierreCaja = async (montoRealEfectivo: number, observaciones?: string) => {
    setGuardandoCierre(true);
    try {
      const ok = await cerrarCaja(montoRealEfectivo, observaciones);
      return ok;
    } catch (error: any) {
      setAvisoModal("Error al cerrar caja: " + error.message);
      return false;
    } finally {
      setGuardandoCierre(false);
    }
  };

  const handleVerTicket = async (m: any) => {
    const idPedidoRaw = m.pedido?.idPedido || m.pedido?.id_pedido || (m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1]?.trim() : null);

    if (idPedidoRaw && !isNaN(Number(idPedidoRaw))) {
      const idPedido = Number(idPedidoRaw);

      try {
        const pedidoCompleto = await cajaService.obtenerPedidoPorId(idPedido);
        if (pedidoCompleto) {
          setTicketSeleccionado({ pedido: pedidoCompleto, movimiento: m });
          return;
        }
      } catch (errService) {
        console.error("Error al obtener pedido mediante cajaService:", errService);
      }
    }

    const pedidoAdaptado = {
      id_pedido: idPedidoRaw || '-',
      cliente: {
        persona: null,
        razon_social: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final',
        nombre: m.categoria === 'INSUMOS' ? 'Compra Insumos / Proveedor' : 'Consumidor Final'
      },
      monto_total: m.monto,
      observaciones: m.descripcion || 'Movimiento registrado en caja'
    };

    setTicketSeleccionado({ pedido: pedidoAdaptado, movimiento: m });
  };

  useEffect(() => {
  let urlCreada: string | null = null;

  if (imagenComprobanteModal) {
    setCargandoComprobante(true);
    cajaService.obtenerBlobComprobante(imagenComprobanteModal)
      .then((blobUrl) => {
        urlCreada = blobUrl;
        setComprobanteBlobUrl(blobUrl);
      })
      .catch((err) => {
        console.error('Error al cargar comprobante:', err);
        setComprobanteBlobUrl(null);
      })
      .finally(() => setCargandoComprobante(false));
  } else {
    setComprobanteBlobUrl(null);
  }

  return () => {
    if (urlCreada) URL.revokeObjectURL(urlCreada);
  };
  }, [imagenComprobanteModal]);

  return (
    <SidebarLayout activeItem="Caja">
      <div className={`container-fluid p-3 font-monospace ${textColor}`}>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mx-auto font-monospace" style={{ fontSize: '2.8rem' }}>Caja</h1>
        </div>

        <div className="row g-4 mb-4">
          <ResumenTurnoCard
            cajaAbierta={cajaAbierta}
            saldoCaja={saldoCaja}
            turnoActual={turnoActual}
            ingresosTurno={ingresosTurno}
            egresosTurno={egresosTurno}
            cardBg={cardBg}
            cardBorder={cardBorder}
          />

          <GraficoFlujoCajaCard
            cajaAbierta={cajaAbierta}
            movimientos={movimientos}
            cardBg={cardBg}
            cardBorder={cardBorder}
            shadowStyle={shadowStyle}
            graphInnerBg={graphInnerBg}
            chartGrid={chartGrid}
            chartTick={chartTick}
            dotColor={dotColor}
          />
        </div>

        <div className="row g-4 align-items-stretch mb-4">
          <TablaMovimientosCaja
            movimientos={movimientos}
            isDark={isDark}
            tableWrapBg={tableWrapBg}
            cardBorder={cardBorder}
            shadowStyle={shadowStyle}
            theadBg={theadBg}
            onVerComprobante={(url) => setImagenComprobanteModal(url)}
            onVerTicket={handleVerTicket}
          />

          <AccionesRapidasCaja
            cajaAbierta={cajaAbierta}
            hayMovimientos={movimientos.length > 0}
            onNuevoMovimiento={() => setIsModalOpen(true)}
            onExportarExcel={() =>
              exportarCajaExcel(movimientos, {
                montoInicial: turnoActual?.montoInicial || 0,
                saldoCaja,
                ingresosTurno,
                egresosTurno,
              })
            }
            onExportarPDF={() =>
              exportarCajaPDF(movimientos, {
                montoInicial: turnoActual?.montoInicial || 0,
                saldoCaja,
                ingresosTurno,
                egresosTurno,
              })
            }
          />
        </div>

        <BarraAccionesTurno
          cajaAbierta={cajaAbierta}
          onVolver={() => navigate('/dashboard')}
          onIniciarCaja={handleAbrirAperturaModal}
          onConsultarArqueo={handleConsultarArqueo}
          onCerrarTurno={handleAbrirCierreModal}
        />
      </div>

      {showModalApertura && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: '2px solid #10b981', borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold">Apertura de Caja</h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setShowModalApertura(false)}></button>
              </div>
              <form onSubmit={confirmarAperturaCaja}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label htmlFor="montoInicial" className="form-label small text-uppercase fw-semibold">
                      Monto inicial para abrir la caja ($):
                    </label>
                    <input 
                      type="number" step="0.01" min="0" id="montoInicial"
                      className={`form-control form-control-lg font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      style={{ fontSize: '1.6rem', textAlign: 'center', color: '#10b981' }}
                      value={montoInicialInput} 
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMontoInicialInput(e.target.value)}
                      required autoFocus
                    />
                  </div>
                  <p className="small text-center m-0 opacity-75">
                    Este monto se guardará como saldo inicial en el registro de arqueo.
                  </p>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-danger px-4" onClick={() => setShowModalApertura(false)} disabled={guardandoApertura}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success px-4" disabled={guardandoApertura}>
                    {guardandoApertura ? 'Abriendo...' : 'Abrir Caja'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {movimientoAjuste && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-counterclockwise"></i> Corrección / Ajuste de Movimiento
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setMovimientoAjuste(null)}></button>
              </div>
              <form onSubmit={handleConfirmarAjuste}>
                <div className="modal-body py-3">
                  <div className="p-3 mb-3 rounded" style={{ backgroundColor: isDark ? '#27272a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                    <div className="small text-muted mb-1">Movimiento Original:</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        #{movimientoAjuste.id_movimiento || movimientoAjuste.idMovimiento || '-'} - {movimientoAjuste.descripcion || 'Sin descripción'}
                      </span>
                      <span className={`fw-bold ${movimientoAjuste.tipoMovimiento === 'EGRESO' ? 'text-danger' : 'text-success'}`}>
                        {movimientoAjuste.tipoMovimiento === 'EGRESO' ? '-' : '+'}${Number(movimientoAjuste.monto).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold">Tipo de Ajuste:</label>
                      <select
                        className={`form-select font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                        value={tipoAjuste}
                        onChange={(e) => setTipoAjuste(e.target.value as 'INGRESO' | 'EGRESO')}
                      >
                        <option value="EGRESO">EGRESO (-)</option>
                        <option value="INGRESO">INGRESO (+)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold">Monto del Ajuste ($):</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                        value={montoAjuste}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setMontoAjuste(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase fw-semibold">Método de Pago:</label>
                    <select
                      className={`form-select font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      value={metodoPagoAjuste}
                      onChange={(e) => setMetodoPagoAjuste(e.target.value)}
                    >
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                      <option value="DEBITO">DÉBITO</option>
                      <option value="CREDITO">CRÉDITO</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase fw-semibold d-flex align-items-center justify-content-between">
                      <span>Comprobante / Imagen (Opcional):</span>
                      {imagenAjuste && <span className="text-success small"><i className="bi bi-check-circle-fill me-1"></i>Cargado</span>}
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      onChange={handleImagenAjusteChange}
                    />
                    {imagenAjuste && (
                      <div className="mt-2 text-center">
                        <img 
                          src={imagenAjuste} 
                          alt="Previsualización" 
                          className="img-thumbnail" 
                          style={{ maxHeight: '100px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="alert alert-warning py-2 mb-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    <span>
                      Se registrará un nuevo movimiento de <strong>{tipoAjuste}</strong> por <strong>${Number(montoAjuste || 0).toFixed(2)}</strong> vía <strong>{metodoPagoAjuste}</strong>.
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small text-uppercase fw-semibold">Motivo del Ajuste:</label>
                    <input 
                      type="text" 
                      className={`form-control font-monospace ${isDark ? 'bg-dark text-white' : 'bg-light text-dark'} border-secondary`}
                      placeholder="Ej: Cobro mal efectuado / cambio de medio de pago / error tipográfico"
                      value={motivoAjuste}
                      onChange={(e) => setMotivoAjuste(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button 
                    type="button" 
                    className="btn btn-secondary px-4" 
                    onClick={() => {
                      setMovimientoAjuste(null);
                      setMetodoPagoAjuste('EFECTIVO');
                      setImagenAjuste(null);
                    }} 
                    disabled={guardandoAjuste}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-warning px-4 text-dark fw-bold" disabled={guardandoAjuste}>
                    {guardandoAjuste ? 'Procesando...' : 'Confirmar Ajuste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {avisoModal && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${textColor} font-monospace`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i> Validación
                </h5>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setAvisoModal(null)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="m-0 fs-6">{avisoModal}</p>
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setAvisoModal(null)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exitoModal && (
        <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100 }} role="dialog">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div 
              className="modal-content text-white font-monospace text-center p-4" 
              style={{ 
                backgroundColor: '#18181b', 
                border: '1.5px solid #a855f7', 
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="modal-body p-0">
                <div className="mb-3 d-flex justify-content-center">
                  <i className="bi bi-check-lg" style={{ fontSize: '3.5rem', color: '#a855f7', lineHeight: 1 }}></i>
                </div>

                <h4 className="fw-bold mb-2 text-white" style={{ fontSize: '1.4rem' }}>
                  {exitoModal.titulo}
                </h4>

                <p className="text-secondary small mb-4 opacity-75" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {exitoModal.descripcion}
                </p>

                <button 
                  type="button" 
                  className="btn btn-danger fw-bold px-4 py-2 border-0" 
                  style={{ backgroundColor: '#ef4444', borderRadius: '8px', minWidth: '100px' }}
                  onClick={() => setExitoModal(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalNuevoIngreso 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGuardar={handleGuardarMovimiento}
      />
      
      <ModalConsultarArqueo 
        isOpen={showModalArqueo}
        onClose={() => setShowModalArqueo(false)}
        datosArqueo={datosArqueo}
        montoInicial={turnoActual?.montoInicial || 0}
        movimientos={movimientos}
      />

      <ModalCerrarTurno
        isOpen={showModalCierre}
        onClose={() => setShowModalCierre(false)}
        datosArqueo={datosArqueo}
        montoInicialTurno={turnoActual?.montoInicial || 0}
        onConfirmarCierre={ejecutarCierreCaja}
        guardando={guardandoCierre}
        movimientos={movimientos}
      />

      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={!ticketSeleccionado.pedido.id_pedido || ticketSeleccionado.pedido.id_pedido === '-'}
        />
      )}

      {imagenComprobanteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className={`modal-content p-3 ${textColor}`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setImagenComprobanteModal(null)}></button>
              </div>
              <div className="text-center p-2">
  {cargandoComprobante ? (
    <p className="opacity-50 py-4 m-0">Cargando comprobante...</p>
  ) : comprobanteBlobUrl ? (
    <img
      src={comprobanteBlobUrl}
      alt="Comprobante Transferencia"
      className="img-fluid rounded shadow"
      style={{ maxHeight: '70vh', objectFit: 'contain' }}
    />
  ) : (
    <p className="text-danger py-4 m-0">No se pudo cargar el comprobante.</p>
  )}
</div>
              <div className="text-end mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setImagenComprobanteModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )} 
    </SidebarLayout>
  );
};