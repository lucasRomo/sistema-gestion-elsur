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
  onSubirArchivo,
  onEliminarComprobante
}) => {
  // Lógica del nombre del cliente
  const nombreCliente = p.cliente?.persona 
    ? `${p.cliente.persona.nombre} ${p.cliente.persona.apellido}`
    : (p.cliente?.razon_social || p.cliente?.nombre || 'Consumidor Final');

  // Lógica del operador y cierre
  const ultimaAsignacion = p.asignaciones && p.asignaciones.length > 0 
    ? p.asignaciones[p.asignaciones.length - 1] 
    : null;

  const nombreEmpleado = ultimaAsignacion?.empleado?.persona
    ? `${ultimaAsignacion.empleado.persona.nombre} ${ultimaAsignacion.empleado.persona.apellido}`
    : 'Sistema';

  const fechaCierre = p.fecha_modificacion || ultimaAsignacion?.fecha_asignacion;
  const fechaCierreFormateada = fechaCierre
    ? new Date(fechaCierre).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  // Archivos adjuntos
  const tieneComprobante = p.comprobantes && p.comprobantes.length > 0;
  const urlUltimoComprobante = tieneComprobante 
    ? p.comprobantes[p.comprobantes.length - 1].urlArchivoComprobante 
    : null;

  return (
    <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#1d1d1d', transition: 'background 0.2s' }} 
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1d1d1d'}>
      <td className="fw-bold" style={{ color:'#0fdae9', padding: '12px 12px 12px 12px' }}>#{p.id_pedido}</td>
      <td style={{ padding: '15px 20px' }}>
      <span className="fw-semibold text-white">{nombreCliente}</span>
      </td>
      <td>
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
      <td>
        <span className="text-light-50">
          <i className="bi bi-person-check text-secondary me-1"></i>
          {nombreEmpleado}
        </span>
      </td>
      <td className="font-monospace" style={{ color:'#afafaf', fontSize: '0.82rem' }}>
        {fechaCierreFormateada}
      </td>
      <td className="text-center">
        <span className={`badge font-monospace ${p.text_color} ${p.estado === 'CANCELADO' ? 'bg-danger text-white' : p.estado === 'ENTREGADO' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
          {p.estado}
        </span>
      </td>
      <td className="text-light mt-4">${Number(p.monto_total).toFixed(2)}</td>
      <td className="text-success fw-bold">${Number(p.monto_pago_adelantado).toFixed(2)}</td>
      <td>
        <div className="d-flex justify-content-center gap-3 align-items-center">

        <button 
         className="rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', border: '0.8px solid #1a8140', backgroundColor: 'transparent', transition: '0.2s' }}
         onClick={() => onAbrirAuditoria(p.id_pedido)}
         onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a8140'; e.currentTarget.querySelector('i')!.style.color = '#000'; }}
         onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.querySelector('i')!.style.color = '#1a8140'; }}>
         <i className="bi bi-currency-dollar" style={{ color: '#1a8140' }}></i>
        </button>

        <button 
         className="rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', border: '0.8px solid #ffc107', backgroundColor: 'transparent', transition: '0.2s' }}
         onClick={() => onSelectTicket(p)}
         onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffc107'; e.currentTarget.querySelector('i')!.style.color = '#000'; }}
         onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.querySelector('i')!.style.color = '#ffc107'; }}>
         <i className="bi bi-printer" style={{ color: '#ffc107' }}></i>
        </button>
        </div>
      </td>
    </tr>
  );
};