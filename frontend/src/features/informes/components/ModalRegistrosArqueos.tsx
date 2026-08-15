import React, { useState, useEffect } from 'react';
import { cajaService, type MovimientoCaja, type Turno } from '../../../features/caja/services/cajaService';

interface ModalRegistrosArqueoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalRegistrosArqueo: React.FC<ModalRegistrosArqueoProps> = ({ isOpen, onClose }) => {
  const [vista, setVista] = useState<'lista' | 'detalle'>('lista');

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ABIERTO' | 'CERRADO'>('TODOS');

  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [movimientosTurno, setMovimientosTurno] = useState<MovimientoCaja[]>([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setVista('lista');
    setTurnoSeleccionado(null);
    setMovimientosTurno([]);
    setFiltroFecha('');
    setFiltroEstado('TODOS');

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
  };

  const handleClose = () => {
    setVista('lista');
    setTurnoSeleccionado(null);
    setMovimientosTurno([]);
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
    <div className="modal d-block show fade" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }} role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content im-surface border border-secondary border-opacity-25 rounded-4 shadow-lg">
          <div className="modal-header border-bottom border-secondary border-opacity-25">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 text-body">
              <i className="bi bi-journal-check text-warning"></i>
              {vista === 'lista' ? 'Registros de Arqueo' : `Detalle de Turno #${turnoSeleccionado?.idTurno}`}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          <div className="modal-body py-4" style={{ minHeight: '420px' }}>
            {/* ---------- VISTA LISTA DE TURNOS ---------- */}
            {vista === 'lista' && (
              <>
                {/* BARRA DE FILTROS */}
<div className="p-3 rounded-3 mb-3 border border-secondary border-opacity-25 im-surface">
  <div className="row g-3 align-items-end">
    <div className="col-12 col-md-8">
      <label className="form-label small text-body-secondary mb-1">Filtro por Fecha de Apertura:</label>
      <input
        type="date"
        className="form-control"
        value={filtroFecha}
        onChange={(e) => setFiltroFecha(e.target.value)}
      />
    </div>
    <div className="col-8 col-md-3">
      <label className="form-label small text-body-secondary mb-1">Estado:</label>
      <select
        className="form-select"
        value={filtroEstado}
        onChange={(e) => setFiltroEstado(e.target.value as 'TODOS' | 'ABIERTO' | 'CERRADO')}
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
                    <p className="text-body-secondary m-0">Cargando turnos...</p>
                  </div>
                ) : (
                  <div className="rounded-3 border border-secondary border-opacity-25 overflow-hidden im-surface">
  <div className="table-responsive" style={{ maxHeight: '440px', overflowY: 'auto' }}>
    <table className="table table-hover m-0 align-middle text-center">
      <thead className="im-surface" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <tr className="text-body-secondary border-bottom border-secondary border-opacity-25 text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
          <th className="py-3">Id Turno</th>
          <th className="py-3">Fecha/Hora Apertura</th>
          <th className="py-3">Fecha/Hora Cierre</th>
          <th className="py-3">Estado</th>
          <th className="py-3">Acción</th>
        </tr>
      </thead>
      <tbody>
        {turnosFiltrados.length === 0 ? (
          <tr><td colSpan={5} className="py-5 text-body-secondary">No hay turnos que coincidan con el filtro</td></tr>
        ) : (
          turnosFiltrados.map((turno) => (
            <tr key={turno.idTurno} className="border-bottom border-secondary border-opacity-10" style={{ fontSize: '0.95rem' }}>
              <td className="fw-bold text-info">#{turno.idTurno}</td>
              <td className="text-body">{formatFecha(turno.fechaApertura)}</td>
              <td className="text-body">{formatFecha(turno.fechaCierre)}</td>
              <td>{badgeDiferencia(turno)}</td>
              <td>
                <button
                  className="btn btn-sm btn-info fw-semibold"
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
                    <div className="p-3 rounded-3 h-100 border border-secondary border-opacity-25 bg-body-tertiary">
                      <div className="text-body-secondary small mb-1">Monto Inicial</div>
                      <div className="fw-bold fs-5 text-body">{formatMonto(turnoSeleccionado.montoInicial)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100 border border-secondary border-opacity-25 bg-body-tertiary">
                      <div className="text-body-secondary small mb-1">Esperado (Sistema)</div>
                      <div className="fw-bold fs-5 text-body">{formatMonto(saldoEstimadoTurno)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100 border border-secondary border-opacity-25 bg-body-tertiary">
                      <div className="text-body-secondary small mb-1">Real Contado</div>
                      <div className="fw-bold fs-5 text-body">{formatMonto(turnoSeleccionado.montoRealContado)}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-3 h-100 border border-secondary border-opacity-25 bg-body-tertiary">
                      <div className="text-body-secondary small mb-1">Diferencia</div>
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
                    <p className="m-0 text-body-secondary small">{turnoSeleccionado.observaciones}</p>
                  </div>
                )}

                {/* Movimientos del turno */}
                <h6 className="fw-bold text-body-secondary mb-2">Movimientos registrados en el turno</h6>
                {cargandoMovimientos ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info mb-3"></div>
                  </div>
                ) : (
                  <div className="rounded-3 border border-secondary border-opacity-25 overflow-hidden">
                    <div className="table-responsive" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      <table className="table table-hover m-0 align-middle text-center">
                        <thead className="bg-body-tertiary" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr className="text-body-secondary border-bottom border-secondary border-opacity-25 text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                            <th className="py-3">Fecha/Hora</th>
                            <th className="py-3">Monto</th>
                            <th className="py-3">Tipo</th>
                            <th className="py-3 text-start">Descripción</th>
                            <th className="py-3">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientosTurno.length === 0 ? (
                            <tr><td colSpan={5} className="py-4 text-body-secondary">No hay movimientos registrados en este turno</td></tr>
                          ) : (
                            movimientosTurno.map((m) => (
                              <tr key={m.id_movimiento || m.idMovimiento} className="border-bottom border-secondary border-opacity-10" style={{ fontSize: '0.95rem' }}>
                                <td className="text-body">{formatFecha(m.fecha)}</td>
                                <td className="fw-bold" style={{ color: m.tipoMovimiento === 'INGRESO' ? '#20c997' : '#e22e2e' }}>
                                  {m.tipoMovimiento === 'INGRESO' ? '+' : '-'}{formatMonto(m.monto)}
                                </td>
                                <td>
                                  <span className={`badge ${m.tipoMovimiento === 'INGRESO' ? 'bg-success' : 'bg-danger'}`}>
                                    {m.tipoMovimiento === 'INGRESO' ? 'Ganancia' : 'Egreso'}
                                  </span>
                                </td>
                                <td>
                                  <div
                                    className="text-start text-body"
                                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '380px' }}
                                    title={formatDescripcionMovimiento(m)}
                                  >
                                    {formatDescripcionMovimiento(m)}
                                  </div>
                                </td>
                                <td className="text-body-secondary">{m.usuario?.idUsuario || m.usuario?.id_usuario || '-'}</td>
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
          </div>

          <div className="modal-footer border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
  {/* Botón Volver (solo visible en la vista de detalle) */}
  <div>
    {vista === 'detalle' && (
      <button 
        type="button" 
        className="btn btn-secondary px-4" 
        style={{ backgroundColor: '#4076a5', color: '#ffffff', borderColor: '#4076a5' }}
        onClick={handleVolverALista}
      >
        <i className="bi bi-arrow-left me-1"></i> Volver al listado
      </button>
    )}
  </div>

  {/* Botón Cerrar */}
  <button type="button" className="btn btn-secondary px-4" onClick={handleClose}>
    Cerrar Ventana
  </button>
</div>
        </div>
      </div>
    </div>
  );
};