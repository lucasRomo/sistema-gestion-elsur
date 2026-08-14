import React, { useState, useEffect } from 'react';
import { ContadorTiempo } from './ContadorTiempo';
import { useTheme } from '../../../Context/ThemeContext';

interface TarjetaPedidoProps {
  pedido: any;
  empleados: any[];
  onCambioEstado: (pedido: any, estadoDestino: string) => void;
  onCambioUbicacion?: (idPedido: number, nuevaUbicacion: string) => void;
  onSelectPago: (pedido: any) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
  onCambioEmpleado: (idPedido: number, idEmpleado: string) => void;
  onSelectComprobantes: (pedido: any) => void;
  onGestionarMermas?: (pedido: any) => void;
}

interface TimelineItem {
  id: string;
  fechaRaw: string;
  fechaFormateada: string;
  tipo: 'CREACION' | 'ESTADO' | 'EMPLEADO' | 'PAGO' | 'UBICACION' | 'MERMA';
  titulo: string;
  subtitulo?: string;
  monto?: string;
}

export const TarjetaPedido: React.FC<TarjetaPedidoProps> = ({
  pedido: p,
  empleados: e,
  onCambioEstado,
  onCambioUbicacion,
  onCambioEmpleado,
  onSelectPago,
  onSelectTicket,
  onSelectComprobantes,
  onGestionarMermas
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [expandido, setExpandido] = useState<boolean>(false);
  const [mostrarObsModal, setMostrarObsModal] = useState<boolean>(false);
  const [ubicacionInput, setUbicacionInput] = useState<string>(p.ubicacion_estante || 'Taller');

  const cardBg = isDark ? '#121214' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#e2e8f0';
  const selectBg = isDark ? 'bg-black' : 'bg-white';
  const selectTextClaro = isDark ? 'text-light' : 'text-dark';
  const selectTextFuerte = isDark ? 'text-white' : 'text-dark';
  const modalBg = isDark ? 'bg-dark text-white' : 'bg-white text-dark';
  const timelineContainerBg = isDark ? '#09090b' : '#e4e4e4';
  const timelineContainerBorder = isDark ? '#27272a' : '#e2e8f0';
  const timelineCardBg = isDark ? '#18181b' : '#ffffff';
  const timelineCardBorder = isDark ? '#27272a' : '#cbd5e1';
  const timelineTitleText = isDark ? 'text-white' : 'text-dark';

  const nombreCliente = p.cliente?.persona 
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

  const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0
    ? p.asignaciones[p.asignaciones.length - 1]
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : (ultimaAsignacion?.empleado?.nombre ?? 'Sin Asignar');

  const formatearFechaString = (fechaIso: string | null | undefined, incluirHora = true) => {
    if (!fechaIso) return '-';
    const [fecha, horaCompleta] = fechaIso.split('T');
    if (!fecha) return fechaIso;

    const [anio, mes, dia] = fecha.split('-');
    if (!horaCompleta || !incluirHora) return `${dia}/${mes}/${anio}`;

    const [hhStr, mm] = horaCompleta.split('.')[0].split(':');
    let hh = parseInt(hhStr, 10);
    const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
    hh = hh % 12 || 12;
    const hhFormat = hh < 10 ? `0${hh}` : `${hh}`;

    return `${dia}/${mes}/${anio}, ${hhFormat}:${mm} ${ampm}`;
  };

  const formatearHoraOCorta = (fechaIso: string | null | undefined) => {
    if (!fechaIso) return '';
    try {
      const [fecha, horaCompleta] = fechaIso.split('T');
      if (!fecha) return fechaIso;
      const [anio, mes, dia] = fecha.split('-');
      if (!horaCompleta) return `${dia}/${mes}/${anio.slice(2)}`;
      const [hh, mm] = horaCompleta.split(':');
      return `${dia}/${mes}/${anio.slice(2)} - ${hh}:${mm}`;
    } catch {
      return fechaIso;
    }
  };

  const fechaCreacionRaw = p.fecha_creacion || p.fechaCreacion || ultimaAsignacion?.fecha_asignacion;
  const fechaCreacionFormateada = formatearFechaString(fechaCreacionRaw, true);
  const fechaEntregaFormateada = formatearFechaString(p.fecha_entrega_estimada, true);

  const obtenerTimelineInteracciones = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // 1. Creación del Pedido
    if (fechaCreacionRaw) {
      items.push({
        id: 'ev-creacion',
        fechaRaw: fechaCreacionRaw,
        fechaFormateada: formatearHoraOCorta(fechaCreacionRaw),
        tipo: 'CREACION',
        titulo: 'Pedido Creado',
        subtitulo: `Estado: PENDIENTE`
      });
    }

    // 2. Historial de Cambios de Estado / Asignaciones / Ubicación
    const historiales = p.historiales || p.historialEstadoPedidos || [];
    historiales.forEach((h: any, idx: number) => {
      const f = h.fecha_cambio;
      if (!f) return;

      const estadoAnt = h.estado_anterior || 'PENDIENTE';
      const estadoNue = h.estado_nuevo || 'MODIFICADO';
      const esCambioEmpleado = estadoAnt.startsWith('ASIGNADO:') || estadoNue.startsWith('ASIGNADO:');
      const esCambioUbicacion = estadoAnt.startsWith('UBICACION:') || estadoNue.startsWith('UBICACION:');

      let titulo: string;
      let tipoEvento: TimelineItem['tipo'] = 'ESTADO';

      if (esCambioEmpleado) {
        const nombreAnterior = estadoAnt.replace(/^ASIGNADO:\s*/i, '').trim();
        const nombreNuevo = estadoNue.replace(/^ASIGNADO:\s*/i, '').trim();
        titulo = `Cambio de Empleado: ${nombreAnterior} ➔ ${nombreNuevo}`;
        tipoEvento = 'EMPLEADO';
      } else if (esCambioUbicacion) {
        const ubicAnterior = estadoAnt.replace(/^UBICACION:\s*/i, '').trim();
        const ubicNueva = estadoNue.replace(/^UBICACION:\s*/i, '').trim();
        titulo = `Cambio Ubicación: ${ubicAnterior} ➔ ${ubicNueva}`;
        tipoEvento = 'UBICACION';
      } else {
        titulo = `${estadoAnt} ➔ ${estadoNue}`;
      }

      items.push({
        id: `ev-hist-${idx}`,
        fechaRaw: f,
        fechaFormateada: formatearHoraOCorta(f),
        tipo: tipoEvento,
        titulo,
        subtitulo: h.observaciones || undefined
      });
    });

    // 3. Pagos Registrados
    const pagos = p.comprobantes || [];
    pagos.forEach((pago: any, idx: number) => {
      const f = pago.fechaCarga;
      if (!f) return;
      const montoVal = Number(pago.montoPago ?? 0).toFixed(2);
      items.push({
        id: `ev-pago-${idx}`,
        fechaRaw: f,
        fechaFormateada: formatearHoraOCorta(f),
        tipo: 'PAGO',
        titulo: pago.tipoPago ? `Pago (${pago.tipoPago})` : 'Ingreso de Monto',  
        monto: `+$${montoVal}`
      });
    });

    // 4. Mermas Registradas en el Pedido
    const mermas = p.mermas || [];
    mermas.forEach((merma: any, idx: number) => {
      const f = merma.fechaMerma || merma.fecha_merma || merma.fecha;
      if (!f) return;

      const nombreItem = merma.producto?.nombreProducto 
        || merma.insumo?.nombreInsumo 
        || merma.nombreItem 
        || 'Insumo / Producto';

      items.push({
        id: `ev-merma-${idx}`,
        fechaRaw: f,
        fechaFormateada: formatearHoraOCorta(f),
        tipo: 'MERMA',
        titulo: `Merma: ${nombreItem}`,
        subtitulo: `Cantidad: ${merma.cantidad}${merma.motivo ? ` - ${merma.motivo}` : ''}`
      });
    });

    // 5. Ubicación Actual (si aplica)
    if (p.ubicacion_estante && p.ubicacion_estante !== 'Taller') {
      items.push({
        id: 'ev-ubic-actual',
        fechaRaw: fechaCreacionRaw,
        fechaFormateada: formatearHoraOCorta(fechaCreacionRaw),
        tipo: 'UBICACION',
        titulo: 'Ubicación Actual',
        subtitulo: `➔ ${p.ubicacion_estante}`
      });
    }

    return items.sort((a, b) => new Date(a.fechaRaw).getTime() - new Date(b.fechaRaw).getTime());
  };

  const timelineEvents = obtenerTimelineInteracciones();

  const listaHistoriales = p.historiales || p.historialEstadoPedidos || [];
  const ultimoHistorialDevolucion = listaHistoriales
    .slice()
    .reverse()
    .find((h: any) => 
      (h.observaciones && h.observaciones.toLowerCase().includes('devolución')) ||
      (h.observacion && h.observacion.toLowerCase().includes('devolución')) ||
      h.estado_anterior === 'DEVUELTO' || 
      h.estadoAnterior === 'DEVUELTO'
    );

  const esDevolucionReabierta = Boolean(
    p.estado === 'DEVUELTO' ||
    p.observaciones?.toLowerCase().includes('volver a hacer') || 
    p.observacion?.toLowerCase().includes('volver a hacer') ||
    p.observaciones?.toLowerCase().includes('devolución') ||
    p.observacion?.toLowerCase().includes('devolución') ||
    Boolean(p.observacion_devolucion || p.motivo_devolucion) ||
    Boolean(ultimoHistorialDevolucion)
  );

  const textoDevolucion = 
    p.observacion_devolucion || 
    p.motivo_devolucion || 
    ultimoHistorialDevolucion?.observaciones || 
    ultimoHistorialDevolucion?.observacion || 
    null;

  const tieneObservaciones = Boolean(
    (p.observaciones && p.observaciones.trim() !== '') ||
    (p.observacion && p.observacion.trim() !== '') ||
    textoDevolucion ||
    esDevolucionReabierta
  );

  useEffect(() => {
    setUbicacionInput(p.ubicacion_estante || 'Taller');
  }, [p.ubicacion_estante]);

  const confirmarUbicacion = () => {
    const valor = ubicacionInput.trim();
    if (valor && valor !== p.ubicacion_estante && onCambioUbicacion) {
      onCambioUbicacion(p.id_pedido, valor);
    } else if (!valor) {
      setUbicacionInput(p.ubicacion_estante || 'Taller'); 
    }
  };

  return (
    <>
      <div 
        className="card w-100 shadow-sm transition-all text-white mb-2"
        style={{ 
          backgroundColor: cardBg, 
          border: `1px solid ${cardBorder}`,
          borderRadius: '12px'
        }}
      >
        {/* FILA SUPERIOR COMPACTA */}
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-info font-monospace fs-5">#{p.id_pedido}</span>
            {p.cliente?.persona?.telefono && (
              <a href={`https://wa.me/${p.cliente.persona.telefono}`} target="_blank" rel="noreferrer" className="text-success me-1">
                <i className="bi bi-whatsapp fs-5"></i>
              </a>
            )}
            {p.cliente?.persona?.email && (
              <a href={`mailto:${p.cliente.persona.email}`} className="text-danger me-1">
                <i className="bi bi-envelope fs-5"></i>
              </a>
            )}
            <span className="fw-bold fs-6 text-white me-1">{nombreCliente}</span>
            {tieneObservaciones && (
              <button 
                className="btn btn-link p-0 text-warning border-0"
                onClick={() => setMostrarObsModal(true)}
                title="Ver observaciones"
              > 
                <i className="bi bi-chat-left-text-fill fs-6"></i>
              </button>
            )}
            {esDevolucionReabierta && (
              <button 
                className="btn btn-link p-0 text-warning border-0"
                onClick={() => setMostrarObsModal(true)}
                title="Pedido devuelto / reabierto"
              >
                <i className="bi bi-arrow-return-left fs-6"></i>
              </button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Tiempo Restante/Sobrepasado:</span>
            <ContadorTiempo fechaEstimadaIso={p.fecha_entrega_estimada} />
          </div>

          <div className="d-flex align-items-center gap-3">
            <div>
              <span className="text-muted small me-2">Estado</span>
              <span className="badge bg-secondary font-monospace text-uppercase px-2 py-1">
                {p.estado}
              </span>
            </div>

            <button 
              className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 font-monospace"
              onClick={() => setExpandido(!expandido)}
            >
              <span>{expandido ? "Menos" : "Más"}</span>
              <i className={`bi bi-chevron-${expandido ? 'up' : 'down'}`}></i>
            </button>
          </div>
        </div>

        {/* CONTENIDO EXPANDIBLE */}
        {expandido && (
          <div className="p-4 d-flex flex-column gap-4">
            
            {/* LÍNEA DE TIEMPO (TIMELINE) */}
            <div 
              className="p-4 rounded-3 border" 
              style={{ 
                backgroundColor: timelineContainerBg, 
                borderColor: timelineContainerBorder,
                boxShadow: isDark ? 'inset 0 0 20px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-4">
                <span className="text-muted small font-monospace text-uppercase tracking-wider">
                  <i className="bi bi-activity text-purple me-2" style={{ color: '#a855f7' }}></i>
                  Historial Traza del Pedido
                </span>
              </div>

              <div className="position-relative overflow-x-auto py-3">
                {timelineEvents.length > 1 && (
                  <div 
                    className="position-absolute" 
                    style={{ 
                      height: '2px', 
                      top: '49px', 
                      left: '80px', 
                      right: '80px', 
                      backgroundColor: '#8b5cf6',
                      boxShadow: '0 0 8px #8b5cf6',
                      zIndex: 0 
                    }} 
                  />
                )}

                <div className="d-flex justify-content-between align-items-start position-relative" style={{ minWidth: `${Math.max(650, timelineEvents.length * 150)}px` }}>
                  {timelineEvents.map((item) => {
                    const esMerma = item.tipo === 'MERMA';
                    const esPago = item.tipo === 'PAGO';

                    return (
                      <div key={item.id} className="d-flex flex-column align-items-center text-center px-2" style={{ width: '160px', zIndex: 1 }}>
                        
                        <span className="text-muted font-monospace mb-2" style={{ fontSize: '0.70rem', lineHeight: '14px' }}>
                          {item.fechaFormateada}
                        </span>

                        <div className="p-1 rounded-circle" style={{ backgroundColor: timelineContainerBg }}>
                          <div 
                            className="rounded-circle"
                            style={{ 
                              width: '14px', 
                              height: '14px', 
                              backgroundColor: esMerma ? '#ef4444' : isDark ? '#ffffff' : '#8b5cf6',
                              border: `3px solid ${esMerma ? '#dc2626' : '#8b5cf6'}`,
                              boxShadow: `0 0 10px ${esMerma ? '#ef4444' : '#a855f7'}`,
                              flexShrink: 0 
                            }} 
                          />
                        </div>

                        <div 
                          className="mt-3 p-2 rounded-2 w-100 border text-start transition-all shadow-sm"
                          style={{ 
                            backgroundColor: timelineCardBg, 
                            borderColor: esPago ? '#10b981' : esMerma ? '#ef4444' : timelineCardBorder
                          }}
                        >
                          <div className={`fw-bold font-monospace ${esMerma ? 'text-danger' : timelineTitleText}`} style={{ fontSize: '0.78rem' }}>
                            {item.titulo}
                          </div>

                          {item.subtitulo && (
                            <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                              {item.subtitulo}
                            </div>
                          )}

                          {item.monto && (
                            <div className="badge font-monospace mt-1" style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: '1px solid #10b981',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.monto}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DATOS SECUNDARIOS Y BOTONERA DE ACCIONES */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-2">
              <div className="d-flex gap-4">
                <div>
                  <span className="text-muted small d-block">Fecha Creación:</span>
                  <span className="text-white font-monospace small">{fechaCreacionFormateada}</span>
                </div>
                <div>
                  <span className="text-muted small d-block">Entrega Estimada:</span>
                  <span className="text-warning font-monospace small fw-semibold">{fechaEntregaFormateada}</span>
                </div>
              </div>

              <div className="d-flex gap-4 align-items-center">
                <div>
                  <span className="text-muted small me-2">Monto Total</span>
                  <span className="fw-bold fs-5 text-white">${Number(p.monto_total).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted small me-2">Abonado</span>
                  <span className="fw-bold fs-5 text-info">${Number(p.monto_pago_adelantado).toFixed(2)}</span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                  onClick={() => onSelectComprobantes(p)}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span>Comprobantes</span>
                </button>

                <button 
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={() => onGestionarMermas && onGestionarMermas(p)}
                >
                  <i className="bi bi-trash3"></i>
                  <span>Mermas</span>
                </button>

                <button 
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                  disabled={esDevolucionReabierta}
                  onClick={() => !esDevolucionReabierta && onSelectPago(p)}
                >
                  <i className="bi bi-currency-dollar"></i>
                  <span>Cobrar / Pago</span>
                </button>

                <button 
                  className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                  onClick={() => onSelectTicket(p)}
                >
                  <i className="bi bi-printer"></i>
                  <span>Ticket</span>
                </button>
              </div>
            </div>

            {/* FORMULARIOS / CONTROLES DE EDICIÓN */}
            <div className="row g-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="col-12 col-md-4">
                <label className="text-muted small font-monospace mb-1">Modificar Estado Proceso</label>
                <select 
                  className={`form-select form-select-sm ${selectBg} ${selectTextFuerte} border-secondary font-monospace`}
                  value={p.estado}
                  onChange={(e) => onCambioEstado(p, e.target.value)}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                  <option value="ENTREGADO">ENTREGADO ➔</option>
                  <option value="PAUSADO">PAUSADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="text-muted small font-monospace mb-1">Empleado Asignado:</label>
                <select 
                  className={`form-select form-select-sm ${selectBg} ${selectTextClaro} border-secondary font-monospace`}
                  value={
                    ultimaAsignacion?.empleado?.idEmpleado || 
                    ultimaAsignacion?.empleado?.id_empleado || 
                    ''
                  }
                  onChange={(e) => onCambioEmpleado(p.id_pedido, e.target.value)}
                >
                  <option value="" disabled>
                    {nombreEmpleado !== 'Sin Asignar' ? nombreEmpleado : 'Seleccionar Operario'}
                  </option>
                  {e && e.map((emp) => {
                    const idEmp = emp.idEmpleado || emp.id_empleado;
                    const nombreEmp = emp.persona 
                      ? `${emp.persona.nombre} ${emp.persona.apellido}` 
                      : (emp.nombre || `Empleado #${idEmp}`);

                    return (
                      <option key={`emp-opt-${idEmp}`} value={idEmp}>
                        {nombreEmp}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="text-muted small font-monospace mb-1">Modificación de Ubicación Actual:</label>
                {p.estado === 'PRESUPUESTO' ? (
                  <span className="badge bg-black text-warning border border-warning-subtle font-monospace d-block py-2">
                    Cotización
                  </span>
                ) : (
                  <input
                    type="text"
                    className={`form-control form-control-sm ${selectBg} text-warning border-warning-subtle font-monospace`}
                    value={ubicacionInput}
                    onChange={(e) => setUbicacionInput(e.target.value)}
                    onBlur={confirmarUbicacion}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    maxLength={20}
                    placeholder="Ej: Taller, Mostrador, Depósito..."
                  />
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL OBSERVACIONES */}
      {mostrarObsModal && (
        <div 
          className="modal d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1055 }}
          onClick={() => setMostrarObsModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content ${modalBg} border border-warning shadow-lg`}>
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title font-monospace text-warning d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text-fill"></i> Observaciones - Pedido #{p.id_pedido}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarObsModal(false)}></button>
              </div>
              <div className="modal-body font-monospace d-flex flex-column gap-3">
                <div>
                  <span className="fw-bold text-warning d-block mb-1">Descripción:</span>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {p.observaciones || p.observacion || 'Sin observaciones registradas.'}
                  </div>
                </div>

                {(textoDevolucion || esDevolucionReabierta) && (
                  <div className="p-2 rounded border border-danger-subtle bg-danger bg-opacity-10">
                    <span className="fw-bold text-danger d-flex align-items-center gap-1 mb-1">
                      <i className="bi bi-arrow-return-left"></i> Observación por Devolución:
                    </span>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {textoDevolucion || 'Pedido reabierto por devolución.'}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top border-secondary">
                <button type="button" className="btn btn-outline-warning font-monospace" onClick={() => setMostrarObsModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};