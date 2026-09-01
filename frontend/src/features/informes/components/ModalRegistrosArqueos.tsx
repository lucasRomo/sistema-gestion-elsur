import React, { useState, useEffect } from 'react';
import { cajaService, type MovimientoCaja, type Turno } from '../../../features/caja/services/cajaService';
import { renderBadgeCategoria } from '../../../features/caja/components/RenderBadgeCategoria';
import { useTheme } from '../../../Context/ThemeContext';
import { VistaTicketPagoModal } from '../../../components/modals/VistaTicketPagoModal';

interface ModalRegistrosArqueoProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIAS_FILTRO = [
  { value: 'TODAS', label: 'Todas las categorías' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'INSUMOS', label: 'Insumos' },
  { value: 'CTA_CTE', label: 'Cuenta Corriente' },
  { value: 'AJUSTE', label: 'Ajuste' },
];

export const ModalRegistrosArqueo: React.FC<ModalRegistrosArqueoProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Variables de estilo unificadas para el modal
  const modalBg = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#a1a1aa' : '#475569';
  const cardBorder = isDark ? '#3f3f46' : '#e2e8f0';

  const [vista, setVista] = useState<'lista' | 'detalle'>('lista');

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ABIERTO' | 'CERRADO'>('TODOS');

  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [movimientosTurno, setMovimientosTurno] = useState<MovimientoCaja[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  // Filtros para la tabla de movimientos dentro del detalle de turno
  const [filtroCategoriaMov, setFiltroCategoriaMov] = useState('TODAS');
  const [filtroHoraDesde, setFiltroHoraDesde] = useState('');
  const [filtroHoraHasta, setFiltroHoraHasta] = useState('');

  // Estados para modales de Comprobante e Imagen de Transferencia
  const [ticketSeleccionado, setTicketSeleccionado] = useState<{ pedido: any; movimiento: any } | null>(null);
  const [imagenComprobanteModal, setImagenComprobanteModal] = useState<string | null>(null);

  // Helper para normalizar la URL de la imagen del comprobante
  const obtenerUrlComprobante = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Handler para obtener los datos requeridos por VistaTicketPagoModal
  const handleVerTicket = async (m: any) => {
    const idPedidoRaw = m.pedido?.idPedido || m.pedido?.id_pedido || (m.descripcion?.includes('Pedido #') ? m.descripcion.split('#')[1]?.trim() : null);

    if (idPedidoRaw && !isNaN(Number(idPedidoRaw))) {
      const idPedido = Number(idPedidoRaw);
      try {
        const response = await fetch(`http://localhost:8080/api/pedidos/${idPedido}`);
        if (response.ok) {
          const pedidoCompleto = await response.json();
          setTicketSeleccionado({ pedido: pedidoCompleto, movimiento: m });
          return;
        }
      } catch (error) {
        console.error('Error consultando datos completos del pedido:', error);
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
    if (!isOpen) return;

    setVista('lista');
    setTurnoSeleccionado(null);
    setMovimientosTurno([]);
    setFiltroFecha('');
    setFiltroEstado('TODOS');
    setTicketSeleccionado(null);
    setImagenComprobanteModal(null);

    const cargarTurnos = async () => {
      setCargandoTurnos(true);
      try {
        const data = await cajaService.obtenerTodosLosTurnos();
        setTurnos(data);
      } finally {
        setCargandoTurnos(false);
      }
    };

    cargarTurnos();
  }, [isOpen]);

  const handleVerDetalle = async (turno: Turno) => {
    setTurnoSeleccionado(turno);
    setVista('detalle');
    setFiltroCategoriaMov('TODAS');
    setFiltroHoraDesde('');
    setFiltroHoraHasta('');
    setCargandoMovimientos(true);
    try {
      const data = await cajaService.obtenerMovimientosPorTurno(turno.idTurno);
      setMovimientosTurno(data);
    } finally {
      setCargandoMovimientos(false);
    }
  };

  const handleVolverALista = () => {
    setVista('lista');
    setTurnoSeleccionado(null);
    setMovimientosTurno([]);
    setFiltroCategoriaMov('TODAS');
    setFiltroHoraDesde('');
    setFiltroHoraHasta('');
    setTicketSeleccionado(null);
    setImagenComprobanteModal(null);
  };

  const handleClose = () => {
    setVista('lista');
    setTurnoSeleccionado(null);
    setMovimientosTurno([]);
    setFiltroCategoriaMov('TODAS');
    setFiltroHoraDesde('');
    setFiltroHoraHasta('');
    setTicketSeleccionado(null);
    setImagenComprobanteModal(null);
    onClose();
  };

  const totalIngresosTurno = movimientosTurno
    .filter((m) => m.tipoMovimiento === 'INGRESO')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const totalEgresosTurno = movimientosTurno
    .filter((m) => m.tipoMovimiento === 'EGRESO')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const saldoEstimadoTurno = turnoSeleccionado
    ? Number(turnoSeleccionado.montoInicial || 0) + totalIngresosTurno - totalEgresosTurno
    : 0;

  if (!isOpen) return null;

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-AR');
  };

  const formatMonto = (monto?: number) => `$${Number(monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const fechaLocalISO = (fecha?: string | null) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const turnosFiltrados = turnos.filter((turno) => {
    const coincideFecha = !filtroFecha || fechaLocalISO(turno.fechaApertura) === filtroFecha;
    const coincideEstado = filtroEstado === 'TODOS' || turno.estado === filtroEstado;
    return coincideFecha && coincideEstado;
  });

  const obtenerCategoriaEfectiva = (m: MovimientoCaja): string => {
    if (m.categoria === 'AJUSTE') return 'AJUSTE';
    if (m.categoria === 'EGRESO_MANTENIMIENTO' || m.categoria === 'MANTENIMIENTO') return 'MANTENIMIENTO';
    if (m.categoria === 'INSUMOS' || m.categoria === 'EGRESO_INSUMOS') return 'INSUMOS';
    if (
      m.categoria === 'CTA_CTE' ||
      m.categoria === 'CUENTA_CORRIENTE' ||
      m.categoria === 'COBRO_CTA_CTE' ||
      m.descripcion?.toLowerCase().includes('cta. cte')
    ) return 'CTA_CTE';
    return m.tipoMovimiento === 'INGRESO' ? 'INGRESO' : 'EGRESO';
  };

  const horaLocalHHmm = (fecha?: string | null) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const movimientosFiltrados = movimientosTurno.filter((m) => {
    const coincideCategoria = filtroCategoriaMov === 'TODAS' || obtenerCategoriaEfectiva(m) === filtroCategoriaMov;

    const horaMov = horaLocalHHmm(m.fecha);
    const coincideDesde = !filtroHoraDesde || horaMov >= filtroHoraDesde;
    const coincideHasta = !filtroHoraHasta || horaMov <= filtroHoraHasta;

    return coincideCategoria && coincideDesde && coincideHasta;
  });

  const formatDescripcionMovimiento = (m: MovimientoCaja) => {
    const desc = m.descripcion || 'Sin descripción';
    return m.pedido ? desc : `Nuevo Movimiento de Caja: ${desc}`;
  };

  const badgeDiferencia = (turno: Turno) => {
    if (!turno.fechaCierre) {
      return <span className="badge bg-warning text-dark fw-bold">En curso</span>;
    }
    const diferencia = Number(turno.diferenciaArqueo || 0);
    if (diferencia === 0) {
      return <span className="badge bg-success text-dark fw-bold">Arqueo Exacto</span>;
    }
    if (diferencia > 0) {
      return <span className="badge bg-info text-dark fw-bold">Sobrante +{formatMonto(diferencia)}</span>;
    }
    return <span className="badge bg-danger text-dark fw-bold">Faltante {formatMonto(diferencia)}</span>;
  };

  return (
    <div className="modal d-block show fade font-monospace" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }} role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div 
          className="modal-content shadow-lg p-3" 
          style={{ 
            backgroundColor: modalBg, 
            border: `1px solid ${cardBorder}`, 
            borderRadius: '14px' 
          }}
        >
          <div className="modal-header border-0 pb-2">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: textColor }}>
              <i className="bi bi-journal-check text-warning"></i>
              {vista === 'lista' ? 'Registros de Arqueo' : `Detalle de Turno #${turnoSeleccionado?.idTurno}`}
            </h5>
            <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={handleClose}></button>
          </div>

          <div className="modal-body py-3" style={{ minHeight: '420px' }}>
            {/* ---------- VISTA LISTA DE TURNOS ---------- */}
            {vista === 'lista' && (
              <>
                {/* BARRA DE FILTROS */}
                <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-8">
                      <label className="form-label small mb-1" style={{ color: textMuted }}>Filtro por Fecha de Apertura:</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        style={{ backgroundColor: isDark ? '#27272a' : '#ffffff', color: textColor, borderColor: cardBorder }}
                      />
                    </div>
                    <div className="col-8 col-md-3">
                      <label className="form-label small mb-1" style={{ color: textMuted }}>Estado:</label>
                      <select
                        className="form-select"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value as 'TODOS' | 'ABIERTO' | 'CERRADO')}
                        style={{ backgroundColor: isDark ? '#27272a' : '#ffffff', color: textColor, borderColor: cardBorder }}
                      >
                        <option value="TODOS">Todos</option>
                        <option value="ABIERTO">Abiertos</option>
                        <option value="CERRADO">Cerrados</option>
                      </select>
                    </div>
                    <div className="col-4 col-md-1 d-grid">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        title="Limpiar filtros"
                        onClick={() => { setFiltroFecha(''); setFiltroEstado('TODOS'); }}
                        disabled={!filtroFecha && filtroEstado === 'TODOS'}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* TABLA DE TURNOS */}
                {cargandoTurnos ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info mb-3"></div>
                    <p className="m-0" style={{ color: textMuted }}>Cargando turnos...</p>
                  </div>
                ) : (
                  <div className="rounded-3 overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                    <div className="table-responsive" style={{ maxHeight: '440px', overflowY: 'auto' }}>
                      <table 
                        className="table table-hover m-0 align-middle text-center"
                        style={{
                          backgroundColor: 'transparent',
                          '--bs-table-bg': 'transparent',
                          '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          color: textColor,
                          borderColor: cardBorder
                        } as React.CSSProperties}
                      >
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: modalBg, zIndex: 1 }}>
                          <tr className="text-uppercase small" style={{ backgroundColor: modalBg, borderBottom: `1px solid ${cardBorder}` }}>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Id Turno</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Fecha/Hora Apertura</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Fecha/Hora Cierre</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Estado</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {turnosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-5 text-muted" style={{ backgroundColor: 'transparent' }}>
                                No hay turnos que coincidan con el filtro
                              </td>
                            </tr>
                          ) : (
                            turnosFiltrados.map((turno) => (
                              <tr key={turno.idTurno} style={{ borderColor: cardBorder }}>
                                <td className="fw-bold text-info" style={{ backgroundColor: 'transparent' }}>#{turno.idTurno}</td>
                                <td style={{ backgroundColor: 'transparent', color: textColor }}>{formatFecha(turno.fechaApertura)}</td>
                                <td style={{ backgroundColor: 'transparent', color: textColor }}>{formatFecha(turno.fechaCierre)}</td>
                                <td style={{ backgroundColor: 'transparent' }}>{badgeDiferencia(turno)}</td>
                                <td style={{ backgroundColor: 'transparent' }}>
                                  <button
  className="btn btn-sm fw-semibold border-0"
  style={{ backgroundColor: '#149bdf', color: '#ffffff' }}
  onClick={() => handleVerDetalle(turno)}
>
  Ver Detalle
</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------- VISTA DETALLE DE TURNO ---------- */}
            {vista === 'detalle' && turnoSeleccionado && (
              <>
                {/* Resumen del arqueo */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                      <div className="small mb-1" style={{ color: textMuted }}>Monto Inicial</div>
                      <div className="fw-bold fs-5" style={{ color: textColor }}>{formatMonto(turnoSeleccionado.montoInicial)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                      <div className="small mb-1" style={{ color: textMuted }}>Esperado (Sistema)</div>
                      <div className="fw-bold fs-5" style={{ color: textColor }}>{formatMonto(saldoEstimadoTurno)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                      <div className="small mb-1" style={{ color: textMuted }}>Real Contado</div>
                      <div className="fw-bold fs-5" style={{ color: textColor }}>{formatMonto(turnoSeleccionado.montoRealContado)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                      <div className="small mb-1" style={{ color: textMuted }}>Diferencia</div>
                      <div className="fw-bold fs-5">{badgeDiferencia(turnoSeleccionado)}</div>
                    </div>
                  </div>
                </div>

                {/* Observación de la diferencia de arqueo */}
                {turnoSeleccionado.observaciones && (
                  <div className="p-3 rounded-3 mb-4 border border-warning bg-warning bg-opacity-10">
                    <div className="fw-bold mb-1 text-warning">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Observación del cierre
                    </div>
                    <p className="m-0 small" style={{ color: textMuted }}>{turnoSeleccionado.observaciones}</p>
                  </div>
                )}

                {/* Movimientos del turno */}
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <h6 className="fw-bold m-0" style={{ color: textColor }}>Movimientos registrados en el turno</h6>
                  {(filtroCategoriaMov !== 'TODAS' || filtroHoraDesde || filtroHoraHasta) && (
                    <span className="small" style={{ color: textMuted }}>
                      Mostrando {movimientosFiltrados.length} de {movimientosTurno.length} movimientos
                    </span>
                  )}
                </div>

                {/* FILTROS DE MOVIMIENTOS: Categoría + Rango Horario */}
                <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: modalBg, border: `1px solid ${cardBorder}` }}>
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-4">
                      <label className="form-label small mb-1" style={{ color: textMuted }}>Filtro por Categoría:</label>
                      <select
                        className="form-select"
                        value={filtroCategoriaMov}
                        onChange={(e) => setFiltroCategoriaMov(e.target.value)}
                        style={{ backgroundColor: isDark ? '#27272a' : '#ffffff', color: textColor, borderColor: cardBorder }}
                      >
                        {CATEGORIAS_FILTRO.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small mb-1" style={{ color: textMuted }}>Hora Desde:</label>
                      <input
                        type="time"
                        className="form-control"
                        value={filtroHoraDesde}
                        onChange={(e) => setFiltroHoraDesde(e.target.value)}
                        style={{ backgroundColor: isDark ? '#27272a' : '#ffffff', color: textColor, borderColor: cardBorder }}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small mb-1" style={{ color: textMuted }}>Hora Hasta:</label>
                      <input
                        type="time"
                        className="form-control"
                        value={filtroHoraHasta}
                        onChange={(e) => setFiltroHoraHasta(e.target.value)}
                        style={{ backgroundColor: isDark ? '#27272a' : '#ffffff', color: textColor, borderColor: cardBorder }}
                      />
                    </div>
                    <div className="col-12 col-md-2 d-grid">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        title="Limpiar filtros"
                        onClick={() => { setFiltroCategoriaMov('TODAS'); setFiltroHoraDesde(''); setFiltroHoraHasta(''); }}
                        disabled={filtroCategoriaMov === 'TODAS' && !filtroHoraDesde && !filtroHoraHasta}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {cargandoMovimientos ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info mb-3"></div>
                  </div>
                ) : (
                  <div className="rounded-3 overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                    <div className="table-responsive" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      <table 
                        className="table table-hover m-0 align-middle text-center"
                        style={{
                          backgroundColor: 'transparent',
                          '--bs-table-bg': 'transparent',
                          '--bs-table-hover-bg': isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          color: textColor,
                          borderColor: cardBorder
                        } as React.CSSProperties}
                      >
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: modalBg, zIndex: 1 }}>
                          <tr className="text-uppercase small" style={{ backgroundColor: modalBg, borderBottom: `1px solid ${cardBorder}` }}>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Fecha/Hora</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Monto</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Tipo</th>
                            <th className="py-3 text-start" style={{ backgroundColor: modalBg, color: textMuted }}>Descripción</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Usuario</th>
                            <th className="py-3" style={{ backgroundColor: modalBg, color: textMuted }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-muted" style={{ backgroundColor: 'transparent' }}>
                                {movimientosTurno.length === 0
                                  ? 'No hay movimientos registrados en este turno'
                                  : 'No hay movimientos que coincidan con el filtro'}
                              </td>
                            </tr>
                          ) : (
                            movimientosFiltrados.map((m: any) => {
                              const imagenAdjunta = 
                                m.comprobanteImagen || 
                                m.comprobante || 
                                m.imagenComprobante || 
                                m.comprobante_imagen || 
                                m.imagen_comprobante ||
                                m.urlComprobante ||
                                m.url_comprobante;

                              return (
                                <tr key={m.id_movimiento || m.idMovimiento} style={{ borderColor: cardBorder }}>
                                  <td style={{ backgroundColor: 'transparent', color: textColor }}>{formatFecha(m.fecha)}</td>
                                  <td className="fw-bold" style={{ backgroundColor: 'transparent', color: m.tipoMovimiento === 'INGRESO' ? '#20c997' : '#e22e2e' }}>
                                    {m.tipoMovimiento === 'INGRESO' ? '+' : '-'}{formatMonto(m.monto)}
                                  </td>
                                  <td style={{ backgroundColor: 'transparent' }}>{renderBadgeCategoria(m, isDark)}</td>
                                  <td style={{ backgroundColor: 'transparent' }}>
                                    <div
                                      className="text-start"
                                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '380px', color: textColor }}
                                      title={formatDescripcionMovimiento(m)}
                                    >
                                      {formatDescripcionMovimiento(m)}
                                    </div>
                                  </td>
                                  <td style={{ backgroundColor: 'transparent', color: textMuted }}>
                                    {typeof m.usuario === 'object' && m.usuario !== null
                                      ? (m.usuario.idUsuario || m.usuario.id_usuario || '-')
                                      : (m.usuario || '-')}
                                  </td>
                                  <td style={{ backgroundColor: 'transparent' }}>
                                    <div className="d-flex justify-content-center gap-1">
                                      {imagenAdjunta && (
                                        <button
                                          className="btn btn-sm btn-outline-info border-0 p-1"
                                          title="Ver Comprobante de Transferencia"
                                          onClick={() => setImagenComprobanteModal(imagenAdjunta)}
                                        >
                                          <i className="bi bi-eye fs-5"></i>
                                        </button>
                                      )}
                                      <button
                                        className="btn btn-sm btn-outline-info border-0 p-1"
                                        title="Ver Ticket de Comprobante"
                                        onClick={() => handleVerTicket(m)}
                                      >
                                        <i className="bi bi-receipt fs-5"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer border-0 d-flex justify-content-between align-items-center pt-3">
            <div>
              {vista === 'detalle' && (
                <button 
                  type="button" 
                  className="btn px-4 fw-bold border-0 shadow-sm" 
                  style={{ backgroundColor: '#4076a5', color: '#ffffff' }}
                  onClick={handleVolverALista}
                >
                  <i className="bi bi-arrow-left me-1"></i> Volver al listado
                </button>
              )}
            </div>

            <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={handleClose}>
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>

      {/* MODAL VER TICKET DE PAGO */}
      {ticketSeleccionado && (
        <VistaTicketPagoModal
          pedido={ticketSeleccionado.pedido}
          movimiento={ticketSeleccionado.movimiento}
          onClose={() => setTicketSeleccionado(null)}
          esVentaRapida={!ticketSeleccionado.pedido.id_pedido || ticketSeleccionado.pedido.id_pedido === '-'}
        />
      )}

      {/* MODAL VER IMAGEN DE COMPROBANTE DE TRANSFERENCIA */}
      {imagenComprobanteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1080 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className={`modal-content p-3 ${textColor}`} style={{ backgroundColor: isDark ? '#18181b' : '#ffffff' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0"><i className="bi bi-image me-2"></i>Comprobante de Transferencia</h6>
                <button type="button" className={`btn-close ${isDark ? 'btn-close-white' : ''}`} onClick={() => setImagenComprobanteModal(null)}></button>
              </div>
              <div className="text-center p-2">
                <img 
                  src={obtenerUrlComprobante(imagenComprobanteModal)} 
                  alt="Comprobante Transferencia" 
                  className="img-fluid rounded shadow" 
                  style={{ maxHeight: '70vh', objectFit: 'contain' }} 
                />
              </div>
              <div className="text-end mt-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setImagenComprobanteModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};