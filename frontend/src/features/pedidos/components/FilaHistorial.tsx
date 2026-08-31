import React from 'react';
import { useTheme } from '../../../Context/ThemeContext';

interface FilaHistorialProps {
  pedido: any;
  onAbrirAuditoria: (idPedido: number) => void;
  onSelectTicket: (pedido: any) => void;
  onSubirArchivo: (idPedido: number, file: File) => void;
  onEliminarComprobante: (idPedido: number) => void;
  onAbrirDevolucion: (pedido: any) => void;
  onAbrirMermas: (pedido: any) => void;
}

export const FilaHistorial: React.FC<FilaHistorialProps> = ({
  pedido: p,
  onAbrirAuditoria,
  onSelectTicket,
  onAbrirDevolucion,
  onAbrirMermas,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rowBorder = isDark ? '#27272a' : '#f1f5f9';
  const rowHoverBg = isDark ? '#27272a' : '#f8fafc';
  const tableText = isDark ? '#e4e4e7' : '#18181b';
  const clienteColor = isDark ? '#ffffff' : '#0f172a';
  const fechaColor = isDark ? '#a1a1aa' : '#64748b';
  const empleadoColor = isDark ? '#d4d4d8' : '#334155';

  // Nombre del cliente
  const nombreCliente = p.cliente?.persona 
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

  // Operador de cierre
  const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0 
    ? p.asignaciones[p.asignaciones.length - 1] 
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : 'Sistema';

  // Formateador de fechas
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

  const fechaAsignacionRaw = p.fecha_creacion || ultimaAsignacion?.fecha_asignacion;
  const fechaAsignacionFormateada = formatearFechaString(fechaAsignacionRaw);
  const fechaEntregaEstimadaFormateada = formatearFechaString(p.fecha_entrega_estimada);
  
  const fechaEntregaFinalRaw = p.fecha_finalizacion || p.fecha_modificacion || ultimaAsignacion?.fecha_asignacion;
  const fechaEntregaFinalFormateada = formatearFechaString(fechaEntregaFinalRaw);

  return (
    <tr 
      style={{ borderBottom: `1px solid ${rowBorder}` }} 
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = rowHoverBg}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* ID */}
      <td className="py-3 px-3 text-center text-info fw-bold">
        #{p.id_pedido}
      </td>
      
      {/* Cliente */}
      <td className="py-3 px-3 text-start">
        <span className="fw-semibold" style={{ color: clienteColor }}>{nombreCliente}</span>
      </td>

      {/* Contacto */}
      <td className="py-3 px-3 text-center">
        <div className="d-flex justify-content-center gap-1">
          {p.cliente?.persona?.telefono && (
            <a href={`https://wa.me/${p.cliente.persona.telefono}`} target="_blank" rel="noreferrer" className="btn btn-sm text-success p-1" title="Enviar WhatsApp">
              <i className="bi bi-whatsapp"></i>
            </a>
          )}
          {p.cliente?.persona?.email && (
            <a href={`mailto:${p.cliente.persona.email}`} className="btn btn-sm text-danger p-1" title="Enviar Email">
              <i className="bi bi-envelope"></i>
            </a>
          )}
          {!p.cliente?.persona?.telefono && !p.cliente?.persona?.email && (
            <span className="text-muted small">-</span>
          )}
        </div>
      </td>

      {/* Operador de Cierre */}
      <td className="py-3 px-3 text-start">
        <span style={{ color: empleadoColor }}>
          <i className="bi bi-person-check text-secondary me-1"></i>
          {nombreEmpleado}
        </span>
      </td>

      {/* Fecha Creación */}
      <td className="py-3 px-3 text-center font-monospace" style={{ color: fechaColor, fontSize: '0.82rem' }}>
        {fechaAsignacionFormateada}
      </td>

      {/* Entrega Estimada */}
      <td className="py-3 px-3 text-center font-monospace text-warning fw-semibold" style={{ fontSize: '0.82rem' }}>
        {fechaEntregaEstimadaFormateada}
      </td>

      {/* Entrega Final */}
      <td className="py-3 px-3 text-center font-monospace text-info fw-semibold" style={{ fontSize: '0.82rem' }}>
        {fechaEntregaFinalFormateada}
      </td>

      {/* Estado Final */}
      <td className="py-3 px-3 text-center">
        <span className={`badge rounded-pill px-3 py-2 ${
          p.estado === 'CANCELADO' 
            ? 'bg-danger bg-opacity-75' 
            : p.estado === 'DEVUELTO' 
            ? 'bg-warning bg-opacity-75 text-dark' 
            : p.estado === 'ENTREGADO' 
            ? 'bg-success bg-opacity-75' 
            : 'bg-secondary bg-opacity-75'
        }`} style={{ color: p.estado === 'DEVUELTO' ? '#000000' : '#ffffff' }}>
          {p.estado}
        </span>
      </td>

      {/* Monto Total */}
      <td className="py-3 px-3 text-center fw-bold" style={{ color: tableText }}>
        ${Number(p.monto_total).toFixed(2)}
      </td>

      {/* Monto Cobrado */}
      <td className="py-3 px-3 text-center text-success fw-bold">
        ${Number(p.monto_pago_adelantado).toFixed(2)}
      </td>
      
      {/* Acciones */}
      <td className="py-3 px-3 text-center">
        <div className="d-flex justify-content-center gap-2 align-items-center">
          <button 
            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center rounded-2" 
            style={{ width: '32px', height: '32px' }}
            onClick={() => onAbrirAuditoria(p.id_pedido)}
            title="Ver Auditoría de Pagos"
          >
            <i className="bi bi-currency-dollar fs-6"></i>
          </button>

          <button 
            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
            style={{ width: '32px', height: '32px' }}
            onClick={() => onSelectTicket(p)}
            title="Imprimir Ticket"
          >
            <i className="bi bi-printer fs-6"></i>
          </button>
          
          <button 
            className="btn btn-outline-warning btn-sm d-flex align-items-center justify-content-center rounded-2" 
            style={{ width: '32px', height: '32px' }}
            onClick={() => onAbrirMermas(p)} 
            title="Ver / Registrar Mermas"
          >
            <i className="bi bi-exclamation-diamond-fill fs-6"></i>
          </button>

          <button 
  className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center rounded-2" 
  style={{ width: '32px', height: '32px' }}
  onClick={() => onAbrirDevolucion(p)}
  title="Devolución de Pedido"
>
  <i className="bi bi-arrow-return-left fs-6"></i>
</button>
        </div>
      </td>
    </tr>
  );
};