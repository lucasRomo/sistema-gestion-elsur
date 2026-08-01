import React from 'react';

interface FilaHistorialProps {
  pedido: any;
  onAbrirAuditoria: (idPedido: number) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
}

export const FilaHistorial: React.FC<FilaHistorialProps> = ({
  pedido: p,
  onAbrirAuditoria,
  onSelectTicket,
}) => {
  // Lógica del nombre del cliente
  const nombreCliente = p.cliente?.persona 
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

  // Lógica del operador
  const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0 
    ? p.asignaciones[p.asignaciones.length - 1] 
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : 'Sistema';

  // Función Helper para dar formato uniforme a las fechas
  const formatearFechaString = (fechaIso: string | null | undefined) => {
    if (!fechaIso) return '-';
    const [fecha, horaCompleta] = fechaIso.split('T');
    if (!fecha) return fechaIso;

    const [anio, mes, dia] = fecha.split('-');
    if (!horaCompleta) return `${dia}/${mes}/${anio}`;

    const [hhStr, mm] = horaCompleta.split('.')[0].split(':');
    let hh = parseInt(hhStr, 10);
    const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
    hh = hh % 12 || 12; 
    const hhFormat = hh < 10 ? `0${hh}` : `${hh}`;

    return `${dia}/${mes}/${anio}, ${hhFormat}:${mm} ${ampm}`;
  };

  // Cálculo de las 3 Fechas
  const fechaAsignacionRaw = p.fecha_creacion || ultimaAsignacion?.fecha_asignacion;
  const fechaAsignacionFormateada = formatearFechaString(fechaAsignacionRaw);
  const fechaEntregaEstimadaFormateada = formatearFechaString(p.fecha_entrega_estimada);
  
  const fechaEntregaFinalRaw = p.fecha_finalizacion || p.fecha_modificacion || ultimaAsignacion?.fecha_asignacion;
  const fechaEntregaFinalFormateada = formatearFechaString(fechaEntregaFinalRaw);

  return (
    <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#1d1d1d', transition: 'background 0.2s' }} 
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1d1d1d'}>
      <td className="fw-bold" style={{ color:'#0fdae9', padding: '12px 12px 12px 12px' }}>#{p.id_pedido}</td>
      <td style={{ padding: '15px 20px' }}>
        <span className="fw-semibold text-white">{nombreCliente}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div className="d-flex gap-1">
          {p.cliente?.persona?.telefono && (
            <a href={`https://wa.me/${p.cliente.persona.telefono}`} target="_blank" rel="noreferrer" className="btn btn-sm text-success p-1">
              <i className="bi bi-whatsapp"></i>
            </a>
          )}
          {p.cliente?.persona?.email && (
            <a href={`mailto:${p.cliente.persona.email}`} className="btn btn-sm text-danger p-1">
              <i className="bi bi-envelope"></i>
            </a>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span className="text-light-50">
          <i className="bi bi-person-check text-secondary me-1"></i>
          {nombreEmpleado}
        </span>
      </td>

      {/* FECHA ASIGNACIÓN */}
      <td className="font-monospace" style={{ color:'#a9a9aa', fontSize: '0.82rem', padding: '12px 24px 12px 12px' }}>
        {fechaAsignacionFormateada}
      </td>

      {/* ENTREGA ESTIMADA */}
      <td className="font-monospace text-warning fw-semibold" style={{ fontSize: '0.82rem', padding: '12px 24px 12px 12px' }}>
        {fechaEntregaEstimadaFormateada}
      </td>

      {/* FECHA DE ENTREGA (FINAL) */}
      <td className="font-monospace text-info fw-semibold" style={{ fontSize: '0.82rem', padding: '12px 24px 12px 12px' }}>
        {fechaEntregaFinalFormateada}
      </td>

      <td className="text-center" style={{ padding: '12px 12px' }}>
        <span className={`badge font-monospace ${p.text_color} ${p.estado === 'CANCELADO' ? 'bg-danger text-white' : p.estado === 'ENTREGADO' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
          {p.estado}
        </span>
      </td>

      {/* MONTO TOTAL */}
      <td className="text-light fw-bold" style={{ padding: '12px 12px' }}>
        ${Number(p.monto_total).toFixed(2)}
      </td>

      {/* MONTO COBRADO */}
      <td className="text-success fw-bold" style={{ padding: '12px 12px' }}>
        ${Number(p.monto_pago_adelantado).toFixed(2)}
      </td>
      {/* ACCIONES */}
      <td style={{ padding: '12px 8px' }}>
        <div className="d-flex justify-content-center gap-2 align-items-center">
          <button 
            className="rounded d-flex align-items-center justify-content-center" 
            style={{ width: '32px', height: '32px', border: '0.8px solid #1a8140', backgroundColor: 'transparent', transition: '0.2s' }}
            onClick={() => onAbrirAuditoria(p.id_pedido)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a8140'; e.currentTarget.querySelector('i')!.style.color = '#000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.querySelector('i')!.style.color = '#1a8140'; }}
            title="Ver Auditoría de Pagos"
          >
            <i className="bi bi-currency-dollar" style={{ color: '#1a8140' }}></i>
          </button>

          <button 
            className="rounded d-flex align-items-center justify-content-center" 
            style={{ width: '32px', height: '32px', border: '0.8px solid #ffc107', backgroundColor: 'transparent', transition: '0.2s' }}
            onClick={() => onSelectTicket(p)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.querySelector('i')!.style.color = '#000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.querySelector('i')!.style.color = '#ffc107'; }}
            title="Imprimir Ticket"
          >
            <i className="bi bi-printer" style={{ color: '#ffc107' }}></i>
          </button>
        </div>
      </td>
    </tr>
  );
};