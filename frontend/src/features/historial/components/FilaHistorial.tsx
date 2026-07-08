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
    <tr className="border-bottom border-dark">
      <td className="fw-bold text-secondary">#{p.id_pedido}</td>
      <td>
        <div className="fw-semibold text-white">{nombreCliente}</div>
        {p.observaciones && (
          <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px', fontSize: '0.75rem' }}>
            {p.observaciones}
          </small>
        )}
      </td>
      <td>
        <div className="d-flex gap-1">
          {p.cliente?.persona?.telefono && (
            <a href={`https://wa.me/${p.cliente.persona.telefono}`} target="_blank" rel="noreferrer" className="btn btn-sm text-success p-1">
              <i className="bi bi-whatsapp"></i>
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
      <td className="font-monospace text-secondary" style={{ fontSize: '0.82rem' }}>
        {fechaCierreFormateada}
      </td>
      <td className="text-center">
        <span className={`badge font-monospace ${p.text_color} ${p.estado === 'CANCELADO' ? 'bg-danger text-white' : p.estado === 'ENTREGADO' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
          {p.estado}
        </span>
      </td>
      <td className="fw-bold text-muted">${Number(p.monto_total).toFixed(2)}</td>
      <td className="text-success fw-bold">${Number(p.monto_pago_adelantado).toFixed(2)}</td>
      <td>
        <div className="d-flex justify-content-center gap-3 align-items-center">
          
          {/* CONTROL DE COMPROBANTE DIGITAL */}
          {tieneComprobante && urlUltimoComprobante ? (
            <div className="d-flex gap-2 align-items-center">
              <button 
                className="btn btn-sm p-0 text-info" 
                title="Ver comprobante"
                onClick={() => window.open(urlUltimoComprobante, '_blank')}
              >
                <i className="bi bi-eye-fill fs-5"></i>
              </button>
              <button 
                className="btn btn-sm p-0 text-danger" 
                title="Eliminar comprobante"
                onClick={() => onEliminarComprobante(p.id_pedido)}
              >
                <i className="bi bi-trash-fill fs-6"></i>
              </button>
            </div>
          ) : (
            <div className="position-relative">
              <label 
                htmlFor={`file-historial-${p.id_pedido}`} 
                className="btn btn-sm p-0 text-light opacity-50 m-0" 
                style={{ cursor: 'pointer' }}
                title="Cargar comprobante"
              >
                <i className="bi bi-cloud-upload-fill fs-5"></i>
              </label>
              <input 
                id={`file-historial-${p.id_pedido}`}
                type="file" 
                className="d-none"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onSubirArchivo(p.id_pedido, e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* BOTÓN DE AUDITORÍA DE CAMBIOS */}
          <button 
            className="btn btn-sm border-0 bg-transparent p-0 text-info" 
            title="Ver Auditoría e Historial de Cambios"
            onClick={() => onAbrirAuditoria(p.id_pedido)}
          >
            <i className="bi bi-currency-dollar fs-4 text-warning"></i>
          </button>

          {/* REIMPRESIÓN DE COMPROBANTES DE ENTREGA */}
          <button 
            className="btn btn-sm p-0 text-secondary" 
            title="Reimprimir Ticket"
            onClick={() => onSelectTicket(p)}
          >
            <i className="bi bi-printer fs-5"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};